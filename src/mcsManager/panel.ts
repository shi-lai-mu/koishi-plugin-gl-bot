import { Context, isEmpty, Logger } from 'koishi';
import { isEqual } from 'lodash';

import { GLBotConfigType } from '../gl';
import { MCSManagerAPI } from './api';
import { RemoteInstanceStatusEnum } from './constants';
import { MCSManagerInstance } from './instance';
import { ServiceRemoteInstanceItem, ServiceRemoteItemCustom } from './type';
import { MCSManagerWebSocketIO } from './ws';

const logger = new Logger('mcsmanager-panel');

export class MCSManagerPanel {
  private isInitialized = false;

  public readonly api: MCSManagerAPI;

  // 所有远程节点及其实例列表
  remotes: ServiceRemoteItemCustom[] = [];

  // 远程连接Map表
  remoteConnectionsMap: Map<string, MCSManagerWebSocketIO> = new Map();

  constructor(
    public readonly ctx: Context,
    public readonly config: GLBotConfigType,
  ) {
    this.api = new MCSManagerAPI(
      ctx.http,
      config.mcManagerHost,
      config.mcManagerWs,
    );
    this.initialize();
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    const { mcManagerUsername, mcManagerPassword } = this.config;

    await this.api.login(mcManagerUsername, mcManagerPassword);
    await this.api.getUserInfo();

    await this.handleRemoteServices();
    await this.getAvailableRemoteInstance();
  }

  // 获取远程服务及其实例列表 [全量]
  async handleRemoteServices() {
    const remoteList = await this.api.getServiceRemoteList();
    const insertList = [];

    for (const remote of remoteList) {
      const instanceList = await this.api.getServiceRemoteInstanceList(
        remote.uuid,
      );

      insertList.push({
        instances: instanceList.map(
          item =>
            new MCSManagerInstance(
              this.ctx,
              this.config,
              this.api,
              this,
              remote,
              item,
            ),
        ),
        ...remote,
      });
    }

    this.remotes = insertList;

    logger.info(
      `已获取到 ${this.remotes.length} 个远程节点及其实例 ${this.remotes.reduce((acc, remote) => acc + remote.instances.length, 0)} 个`,
    );
  }

  // 遍历所有远程节点 选择正在运行中的实力 建立远程连接
  getAvailableRemoteInstance() {
    for (const remote of this.remotes) {
      for (const instance of remote.instances) {
        this.createMCSManagerConnection(remote, instance.cfg);
      }
    }
  }

  // 创建远程连接
  async createMCSManagerConnection(
    remote: ServiceRemoteItemCustom,
    instance: ServiceRemoteInstanceItem,
  ) {
    if (isEqual(instance.status, RemoteInstanceStatusEnum.RUNNING)) {
      const uuid = instance.instanceUuid;

      // 已存在的实例且连接中 直接返回
      if (
        this.remoteConnectionsMap.has(uuid) &&
        this.remoteConnectionsMap.get(uuid).connect.connected
      ) {
        return this.remoteConnectionsMap.get(uuid);
      }

      // 上限检测
      if (
        this.remoteConnectionsMap.size >=
        this.config.mcManagerMaxRemoteConnections
      ) {
        return;
      }

      // 试图自动获取认证信息
      if (isEmpty(remote.auth)) {
        const instanceConnectAuth =
          await this.api.getServiceInstanceConnectAuth(
            remote.uuid,
            instance.instanceUuid,
          );
        remote.auth = instanceConnectAuth;
      }

      if (remote.auth) {
        const ws = new MCSManagerWebSocketIO(
          this.ctx,
          this.config,
          this.api,
          remote,
          instance,
          remote.auth,
        );
        this.remoteConnectionsMap.set(uuid, ws);

        return ws;
      }

      logger.error(
        `远程实例 ${instance.config.nickname} 缺少连接认证信息，无法建立连接`,
      );
    }
  }

  // 模糊搜索实例 通过 实例名称
  async searchInstanceByName(instanceName: string) {
    const instanceMap = new Map<
      string,
      {
        remote: ServiceRemoteItemCustom;
        instance: MCSManagerInstance;
        sort: number;
      }
    >();

    const keywords = instanceName.length < 10 ? instanceName.split('') : [];

    for (const remote of this.remotes) {
      for (const instance of remote.instances) {
        // 连词搜索
        if (instance.cfg.config.nickname.includes(instanceName)) {
          instanceMap.set(instance.cfg.instanceUuid, {
            remote,
            instance,
            sort: 1,
          });
        }

        // 分词搜索
        if (keywords.length) {
          // 索引词权重
          keywords.forEach(keyword => {
            if (instance.cfg.config.nickname.includes(keyword)) {
              if (!instanceMap.has(instance.cfg.instanceUuid)) {
                instanceMap.set(instance.cfg.instanceUuid, {
                  remote,
                  instance,
                  sort: 1,
                });
              } else {
                // 已存在则增加权重
                const record = instanceMap.get(instance.cfg.instanceUuid);
                record.sort += 1;
                instanceMap.set(instance.cfg.instanceUuid, record);
              }
            }
          });
        }
      }
    }

    return Array.from(instanceMap.values()).sort((a, b) => b.sort - a.sort);
  }
}
