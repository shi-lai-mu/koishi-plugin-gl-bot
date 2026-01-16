import { readFileSync } from 'fs';
import { HTTP } from 'koishi';
import {
  CreateInstanceConfig,
  CreateInstanceData,
  MCManagerPanelResponse,
  ServiceInstanceConnectAuth,
  ServiceRemoteInstanceItem,
  ServiceRemoteItem,
  UserInfo,
} from './type';

import { IS_DEV } from '../constants';
const createInstanceUpload = require('./json/createInstanceUpload.json');

export class MCSManagerAPI {
  userInfo: UserInfo;

  get requestHeaders() {
    return {
      cookie: this.authCookie,
      'x-requested-with': 'XMLHttpRequest',
    };
  }

  constructor(
    private http: HTTP,
    private baseUrl: string,
    private wsUrl: string,
    private authCookie?: string,
  ) {}

  public send<T>(url: string | URL, config?: HTTP.RequestConfig) {
    return this.http<T>(url, config);
  }

  async login(username: string, password: string) {
    const result = await this.send(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      data: {
        username,
        password,
      },
    });

    if (result.status === 200 && result.headers.get('set-cookie')) {
      const cookieString = result.headers.get('set-cookie');
      this.authCookie = extractCookiesWithRegex(cookieString);
      return true;
    }
    return false;
  }

  async getUserInfo() {
    const result = await this.send<MCManagerPanelResponse<UserInfo>>(
      `${this.baseUrl}/auth`,
      {
        headers: this.requestHeaders,
      },
    );

    if (result.status === 200) {
      this.userInfo = result.data.data;
      return this.userInfo;
    }

    return null;
  }

  async getServiceRemoteList() {
    try {
      return (
        (
          await this.send<MCManagerPanelResponse<ServiceRemoteItem[]>>(
            `${this.baseUrl}/service/remote_services_list`,
            {
              headers: this.requestHeaders,
              params: {
                token: this.userInfo.token,
              },
            },
          )
        ).data.data ?? []
      );
    } catch (error) {
      // 静默处理网络错误，避免在定时任务中抛出
      console.debug(
        'MCSManagerAPI.getServiceRemoteList failed:',
        error.message,
      );
      return [];
    }
  }

  async getServiceRemoteInstanceList(
    daemonId: string,
    options?: {
      status?: string;
      tag: string[];
      instance_name?: string;
      page?: number;
      page_size?: number;
    },
  ) {
    console.log({
      daemonId,
      options,
    });

    return (
      (
        await this.send<
          MCManagerPanelResponse<{
            data: ServiceRemoteInstanceItem[];
          }>
        >(`${this.baseUrl}/service/remote_service_instances`, {
          headers: this.requestHeaders,
          params: {
            daemonId,
            page: options?.page || 1,
            page_size: options?.page_size || 999,
            status: options?.status || '',
            instance_name: options?.instance_name || '',
            tag: JSON.stringify(options?.tag || []),
            token: this.userInfo.token,
          },
        })
      ).data?.data?.data ?? []
    );
  }

  async getServiceInstanceConnectAuth(
    remoteUUID: string,
    instanceId: string,
  ): Promise<ServiceInstanceConnectAuth | null> {
    return (
      (
        await this.send<MCManagerPanelResponse<ServiceInstanceConnectAuth>>(
          `${this.baseUrl}/protected_instance/stream_channel`,
          {
            method: 'POST',
            headers: this.requestHeaders,
            params: {
              remote_uuid: remoteUUID,
              uuid: instanceId,
              token: this.userInfo.token,
            },
          },
        )
      ).data.data ?? null
    );
  }

  async restartRemoteInstance(
    daemonId: string,
    instanceId: string,
  ): Promise<boolean> {
    return (
      (
        await this.send<
          MCManagerPanelResponse<{
            instanceUuid: string;
          }>
        >(`${this.baseUrl}/protected_instance/restart`, {
          headers: this.requestHeaders,
          params: {
            daemonId,
            uuid: instanceId,
            token: this.userInfo.token,
          },
        })
      ).data.data?.instanceUuid === instanceId
    );
  }

  async stopRemoteInstance(
    daemonId: string,
    instanceId: string,
  ): Promise<boolean> {
    return (
      (
        await this.send<
          MCManagerPanelResponse<{
            instanceUuid: string;
          }>
        >(`${this.baseUrl}/protected_instance/stop`, {
          headers: this.requestHeaders,
          params: {
            daemonId,
            uuid: instanceId,
            token: this.userInfo.token,
          },
        })
      ).data.data?.instanceUuid === instanceId
    );
  }

  async startRemoteInstance(
    daemonId: string,
    instanceId: string,
  ): Promise<boolean> {
    return (
      (
        await this.send<
          MCManagerPanelResponse<{
            instanceUuid: string;
          }>
        >(`${this.baseUrl}/protected_instance/open`, {
          headers: this.requestHeaders,
          params: {
            daemonId,
            uuid: instanceId,
            token: this.userInfo.token,
          },
        })
      ).data.data?.instanceUuid === instanceId
    );
  }

  // 创建实例
  async createInstance(daemonId: string, data: CreateInstanceData) {
    const mergeConfig = Object.assign({}, data, {
      nickname: '',
      startCommand: '',
      stopCommand: 'stop',
      cwd: '.',
      ie: 'utf-8',
      oe: 'utf-8',
      processType: 'general',
      lastDatetime: '',
      type: 'minecraft/java',
      tag: [],
      maxSpace: null,
      endTime: '',
      docker: {
        containerName: '',
        image: '',
        ports: [],
        extraVolumes: [],
        networkMode: 'bridge',
        networkAliases: [],
        cpusetCpus: '',
        workingDir: '/data',
        changeWorkdir: false,
        env: [],
      },
    });

    const result = await this.send<
      MCManagerPanelResponse<ServiceRemoteInstanceItem>
    >(`${this.baseUrl}/instance`, {
      method: 'POST',
      headers: this.requestHeaders,
      params: {
        daemonId,
        token: this.userInfo.token,
      },
      data: mergeConfig,
    });

    if (result.status === 200) {
      return true;
    }

    return;
  }

  async instanceUploadByZip(
    daemonId: string,
    config: Partial<CreateInstanceConfig>,
    file: {
      filename: string;
      size: number;
      path: string;
    },
    onProcessHandle?: (value: string) => void,
  ) {
    const mergeConfig = Object.assign({}, createInstanceUpload, config);
    const uploadDir = '.';

    const { status, data } = await this.send<
      MCManagerPanelResponse<{
        addr: string;
        instanceUuid: string;
        password: string;
        remoteMappings: string[];
      }>
    >(`${this.baseUrl}/instance/upload`, {
      method: 'POST',
      headers: this.requestHeaders,
      params: {
        upload_dir: uploadDir,
        daemonId,
        token: this.userInfo.token,
      },
      data: mergeConfig,
    });

    if (status !== 200 && !data.data.instanceUuid) {
      throw new Error('创建实例上传任务失败');
    }

    const newFile = await this.send<MCManagerPanelResponse<{ id: string }>>(
      `${this.wsUrl}/upload-new/${data.data.password}`,
      {
        headers: this.requestHeaders,
        method: 'POST',
        params: {
          filename: file.filename,
          size: file.size,
          sum: '',
          overwrite: false,
          unzip: true,
          code: 'gbk',
          token: this.userInfo.token,
        },
      },
    );

    if (newFile.status !== 200 || !newFile.data.data.id) {
      throw new Error('上传文件失败');
    }

    // 分片上传文件
    const fileBuffer = readFileSync(file.path);
    const chunkSize = 2 * 1024 * 1024; // 2MB 每个分片
    const totalSize = fileBuffer.length;
    let offset = 0;

    // console.log(
    //   `开始分片上传，文件大小: ${totalSize} bytes，分片大小: ${chunkSize} bytes`,
    // );

    onProcessHandle?.(`正在解压文件...`);
    while (offset < totalSize) {
      const end = Math.min(offset + chunkSize, totalSize);
      const chunk = fileBuffer.slice(offset, end);
      const chunkBlob = new Blob([chunk], {
        type: 'application/octet-stream',
      });

      const formData = new FormData();
      formData.append('file', chunkBlob, file.filename);
      // const progress = ((end / totalSize) * 100).toFixed(0);

      if (IS_DEV) {
        console.log(
          `上传分片: offset=${offset}, size=${chunk.length}, progress=${((end / totalSize) * 100).toFixed(1)}%`,
        );
      }
      const response = await this.send(
        `${this.wsUrl}/upload-piece/${newFile.data.data.id}`,
        {
          method: 'POST',
          params: {
            offset,
            token: this.userInfo.token,
          },
          data: formData,
        },
      );

      if (response.status !== 200) {
        throw new Error(`分片上传失败，offset: ${offset}`);
      }

      offset = end;
    }

    return data.data;
  }

  // 上传文件至实例
  async uploadFileToRemoteInstance(
    daemonId: string,
    filePath: string,
  ): Promise<boolean> {
    const fileBuffer = readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], {
      type: 'application/octet-stream',
    });
    const formData = new FormData();
    formData.append('file', fileBlob);

    const result = await this.send<MCManagerPanelResponse<null>>(
      `${this.baseUrl}/protected_instance/upload_file`,
      {
        method: 'POST',
        headers: {
          ...this.requestHeaders,
        },
        params: {
          daemonId,
          token: this.userInfo.token,
        },
        data: formData,
      },
    );

    return result.status === 200;
  }

  async readServerProperties(
    daemonId: string,
    instanceId: string,
  ): Promise<Record<string, never>> {
    return (
      await this.send<MCManagerPanelResponse<Record<string, never>>>(
        `${this.baseUrl}/protected_instance/process_config/file`,
        {
          headers: this.requestHeaders,
          params: {
            daemonId,
            uuid: instanceId,
            fileName: 'server.properties',
            type: 'properties',
            token: this.userInfo.token,
          },
        },
      )
    ).data.data;
  }

  async readFile(daemonId: string, instanceId: string, target: string) {
    return (
      await this.send<string>(`${this.baseUrl}/files`, {
        method: 'PUT',
        headers: this.requestHeaders,
        params: {
          daemonId,
          uuid: instanceId,
          token: this.userInfo.token,
        },
        data: {
          target,
        },
      })
    ).data;
  }
}

function extractCookiesWithRegex(cookieStr) {
  return cookieStr
    .match(/(\S+=\S+;)/g)
    .filter(v => v !== 'path=/;')
    .join(' ');
}
