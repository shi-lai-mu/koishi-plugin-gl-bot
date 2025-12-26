import { Context, Schema } from 'koishi';
import { GLBotConfigType } from '../gl';
import { MCManagerConfig } from './config';
import { MCSManagerPanel } from './panel';
import { MCSManagerWebSocketIO } from './ws';

export class MCManager {
  static Config = Schema.intersect([MCManagerConfig.Base]);

  private ws: MCSManagerWebSocketIO;
  private panel: MCSManagerPanel;

  constructor(
    private ctx: Context,
    private config: GLBotConfigType,
  ) {
    this.panel = new MCSManagerPanel(ctx, config);
    this.ws = new MCSManagerWebSocketIO(ctx, config);
    ctx.on('ready', this.initialize.bind(this));
  }

  async initialize() {
    await this.panel.initialize();
    this.ws.initialize();
  }
}

export type MCManagerConfigType = typeof MCManager.Config;
