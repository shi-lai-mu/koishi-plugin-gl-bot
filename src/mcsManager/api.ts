import { HTTP } from 'koishi';
import {
  CreateInstanceData,
  MCManagerPanelResponse,
  ServiceInstanceConnectAuth,
  ServiceRemoteInstanceItem,
  ServiceRemoteItem,
  UserInfo,
} from './type';

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
    private authCookie?: string,
  ) {}

  async login(username: string, password: string) {
    const result = await this.http(`${this.baseUrl}/auth/login`, {
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
    const result = await this.http<MCManagerPanelResponse<UserInfo>>(
      `${this.baseUrl}/auth/`,
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
    return (
      (
        await this.http<MCManagerPanelResponse<ServiceRemoteItem[]>>(
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
    return (
      (
        await this.http<
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
        await this.http<MCManagerPanelResponse<ServiceInstanceConnectAuth>>(
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
        await this.http<
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
        await this.http<
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
        await this.http<
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

    const result = await this.http<
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

  async uploadFileToRemoteInstance(
    daemonId: string,
    filePath: string,
  ): Promise<boolean> {
    const formData = new FormData();
    formData.append('file', filePath);

    const result = await this.http<MCManagerPanelResponse<null>>(
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
}

function extractCookiesWithRegex(cookieStr) {
  return cookieStr
    .match(/(\S+=\S+;)/g)
    .filter(v => v !== 'path=/;')
    .join(' ');
}
