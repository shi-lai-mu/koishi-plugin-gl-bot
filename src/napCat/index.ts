import { Context, Schema } from 'koishi';

import { GLBotConfigType } from '../gl';
import { NapCatApi } from './api';
import { NapCatConfig } from './config';

export class NapCat {
  static Config = Schema.intersect([NapCatConfig.Base]);

  public readonly api: NapCatApi;

  constructor(
    private readonly ctx: Context,
    private readonly config: GLBotConfigType,
  ) {
    this.api = new NapCatApi(
      ctx.http,
      config.napCatBaseUrl,
      config.napCatToken,
    );
  }
}
