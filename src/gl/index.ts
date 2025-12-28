import { Context, Logger, Schema } from 'koishi';

import { IS_DEV } from '../constants';
import { MCManager } from '../mcsManager';
import MinecraftSyncMsg from '../queQiao';

const logger = new Logger('gl-bot');

export class GLBot {
  static Config = Schema.intersect([MinecraftSyncMsg.Config, MCManager.Config]);

  private mcSyncMsg: MinecraftSyncMsg;
  private mcsManager: MCManager;

  constructor(
    private ctx: Context,
    private config: GLBotConfigType,
  ) {
    this.mcSyncMsg = new MinecraftSyncMsg(ctx, config);
    this.mcsManager = new MCManager(ctx, config);
    this.initialize();
  }

  private initialize() {
    this.globalCommand();
  }

  private globalCommand() {
    this.ctx.on('message', session => {
      if (IS_DEV) {
        // console.log(JSON.stringify(session, null, 2));
      }
      switch (session.content) {
        case '环境变量':
          session.send(
            `当前环境变量：${Object.entries(process.env)
              .map(([k, v]) => `${k}: ${v}`)
              .join('\n')}`,
          );
          break;

        default:
          break;
      }

      if (~session.content.indexOf('群群')) {
        session.send(`群群似杂鱼！大杂鱼喵`);
      }
    });
  }
}

export class GLBotBase {
  constructor(
    private ctx: Context,
    private config: GLBotConfigType,
  ) {}
}

export type GLBotConfigType = Schemastery.TypeS<typeof GLBot.Config>;
