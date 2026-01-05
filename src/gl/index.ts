import { Context, Logger, Schema } from 'koishi';

import { IS_DEV } from '../constants';
import { MCManager } from '../mcsManager';
import { NapCat } from '../napCat';
import { GLQueQiaoAdapter } from './queqiao.adapter';

const logger = new Logger('gl-bot');

export class GLBot {
  static inject = ['database'];

  static Config = Schema.intersect([
    // MinecraftSyncMsg.Config,
    MCManager.Config,
    NapCat.Config,
  ]);

  // private mcSyncMsg: MinecraftSyncMsg;
  public readonly mcsManager: MCManager;
  public readonly queQiaoAdapter: GLQueQiaoAdapter;
  public readonly napCat: NapCat;

  constructor(
    private ctx: Context,
    private config: GLBotConfigType,
  ) {
    // this.mcSyncMsg = new MinecraftSyncMsg(ctx, config);
    this.mcsManager = new MCManager(this, ctx, config);
    this.queQiaoAdapter = new GLQueQiaoAdapter(this, ctx, config);
    this.napCat = new NapCat(ctx, config);
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
