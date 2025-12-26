import { Context } from 'koishi';

import { GLBotConfigType } from '../gl';
import { MCSManagerAPI } from './api';

export class MCSManagerPanel {
  private isInitialized = false;

  api: MCSManagerAPI;

  constructor(
    public ctx: Context,
    public config: GLBotConfigType,
  ) {
    this.api = new MCSManagerAPI(ctx.http, config.mcManagerHost);
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
  }

  async handleRemoteServices() {
    const { uuid, token } = this.api.userInfo;

    // const result = await this.ctx.http(
    //   `${this.apiBaseUrl}/service/remote_service_instances`,
    //   {
    //     method: 'GET',
    //     headers: this.requestHeaders,
    //     params: {
    //       status: '',
    //       daemonId: uuid,
    //       page: 1,
    //       page_size: 999,
    //       instance_name: '',
    //       token,
    //     },
    //   },
    // );

    // console.log(result);
  }
}
