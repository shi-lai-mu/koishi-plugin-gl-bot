import { Context } from 'koishi';
import { GLBotConfigType } from '../gl';
import { MCSManagerAPI } from './api';
import { MCSManagerPanel } from './panel';
import { ServiceRemoteInstanceItem, ServiceRemoteItem } from './type';

export class MCSManagerInstance {
  public isAuthenticated = false;

  constructor(
    private readonly ctx: Context,
    private readonly config: GLBotConfigType,
    private readonly api: MCSManagerAPI,
    private readonly panel: MCSManagerPanel,
    public remote: ServiceRemoteItem,
    public cfg: ServiceRemoteInstanceItem,
  ) {}

  public async restartInstance() {
    return await this.api.restartRemoteInstance(
      this.remote.uuid,
      this.cfg.instanceUuid,
    );
  }

  public async stopInstance() {
    return await this.api.stopRemoteInstance(
      this.remote.uuid,
      this.cfg.instanceUuid,
    );
  }

  public async startInstance() {
    return await this.api.startRemoteInstance(
      this.remote.uuid,
      this.cfg.instanceUuid,
    );
  }
}
