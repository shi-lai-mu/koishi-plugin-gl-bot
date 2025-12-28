import { Context, Schema } from 'koishi';
import { GLBotConfigType } from '../gl';
import { MCSManagerBot } from './bot';
import { MCManagerConfig } from './config';
import { MCSManagerPanel } from './panel';

export class MCManager {
  static Config = Schema.intersect([MCManagerConfig.Base]);

  private panel: MCSManagerPanel;

  private bot: MCSManagerBot;

  constructor(
    private readonly ctx: Context,
    private readonly config: GLBotConfigType,
  ) {
    this.panel = new MCSManagerPanel(ctx, config);
    this.bot = new MCSManagerBot(ctx, config, this.panel);
    ctx.on('ready', this.initialize.bind(this));
  }

  async initialize() {
    await this.panel.initialize();
  }
}

export type MCManagerConfigType = typeof MCManager.Config;
