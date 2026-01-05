import { Context, Schema } from 'koishi';
import { GLBot, GLBotConfigType } from '../gl';
import { MCSManagerBot } from './bot';
import { MCManagerConfig } from './config';
import { MCSManagerPanel } from './panel';
import { registerMcSchedule } from './schedules';

export class MCManager {
  static Config = Schema.intersect([
    MCManagerConfig.Base,
    MCManagerConfig.QueQiao,
  ]);

  private panel: MCSManagerPanel;

  private bot: MCSManagerBot;

  constructor(
    public readonly gl: GLBot,
    public readonly ctx: Context,
    private readonly config: GLBotConfigType,
  ) {
    registerMcSchedule(ctx);

    this.panel = new MCSManagerPanel(ctx, config);
    this.bot = new MCSManagerBot(this, ctx, config, this.panel);
    ctx.on('ready', this.initialize.bind(this));
  }

  async initialize() {
    await this.panel.initialize();
  }
}

export type MCManagerConfigType = typeof MCManager.Config;
