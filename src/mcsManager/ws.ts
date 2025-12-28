import * as io from 'socket.io-client';

import { Context, Logger } from 'koishi';
import { isEqual } from 'lodash-es';
import { GLBotConfigType } from '../gl';
import { MCSManagerAPI } from './api';
import {
  ServiceInstanceConnectAuth,
  ServiceRemoteInstanceItem,
  ServiceRemoteItemCustom,
} from './type';

const logger = new Logger('mcsmanager-ws');

export class MCSManagerWebSocketIO {
  public connect: io.Socket;

  // 是否已认证通过
  public isAuthenticated = false;

  constructor(
    private readonly ctx: Context,
    private readonly config: GLBotConfigType,
    private readonly api: MCSManagerAPI,
    private remote: ServiceRemoteItemCustom,
    private instance: ServiceRemoteInstanceItem,
    private auth: ServiceInstanceConnectAuth,
  ) {
    this.initialize();
  }

  initialize() {
    if (this.connect) {
      this.connect.close();
    }

    this.connect = io.connect(this.config.mcManagerWs, {
      multiplex: false,
      reconnectionDelayMax: 1000 * 3,
      timeout: 1000 * 3,
      reconnection: true,
      reconnectionAttempts: 2000,
    });

    this.bindEvents();

    logger.info(
      `正在连接到 MCSManager 实例服务器 [${this.remote.remarks}] - ${this.instance.config.nickname} ...`,
    );
  }

  // 发送MC指令到远程实例
  public sendCommand(command: string) {
    this.connect.emit('stream/input', {
      data: { command },
    });

    logger.warn(
      `已向远程实例 ${this.instance.config.nickname} 发送指令：${command}`,
    );
  }

  private bindEvents() {
    this.connect.on('connect', this.onConnect.bind(this));
    this.connect.on('disconnect', this.onDisconnect.bind(this));
    this.connect.on('reconnect', this.onReconnect.bind(this));
    this.connect.on('connect_error', this.onConnectError.bind(this));
  }

  private onConnect() {
    this.authenticate();
  }

  private onDisconnect(reason: string) {
    logger.warn(`与 MCSManager 实例服务器的连接已断开，原因：${reason}`);
  }

  private onReconnect(attemptNumber: number) {
    logger.info(
      `正在重新连接到 MCSManager 实例服务器，尝试次数：${attemptNumber}`,
    );
  }

  private onConnectError(error: Error) {
    logger.error(`连接 MCSManager 实例服务器时出错：${error.message}`);
  }

  public authenticate() {
    this.connect.once('auth', ({ event, status }) => {
      this.connect.once('stream/auth', pack => {
        if (
          isEqual(event, 'auth') &&
          isEqual(status, 200) &&
          isEqual(pack.status, 200) &&
          isEqual(pack.data, true)
        ) {
          logger.info(
            `已成功连接到 MCSManager 实例服务器 [${this.remote.remarks}] - ${this.instance.config.nickname} `,
          );
          this.isAuthenticated = true;
          return pack;
        }

        logger.error(
          `远程实例 ${this.instance.config.nickname} 认证失败，无法建立连接`,
        );
      });

      this.connect.emit('stream/auth', {
        data: {
          password: this.auth.password,
        },
      });
    });

    this.connect.emit('auth', {
      data: this.config.mcManagerKey,
    });
  }
}
