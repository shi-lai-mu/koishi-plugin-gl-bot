import { Context, Logger, Schema } from 'koishi';

import { isEqual } from 'lodash';
import { AliYun } from '../ali/client';
import { AliYunLocalDomain } from '../ali/local.domain';
import { IS_DEV } from '../constants';
import { MCManager } from '../mcsManager';
import { NapCat } from '../napCat';
import { GLConfig } from './config';
import { GLQueQiaoAdapter } from './queqiao.adapter';

const logger = new Logger('gl-bot');

export class GLBot {
  static inject = ['database'];

  static Config = Schema.intersect([
    GLConfig.Base,
    // MinecraftQueQiao.Config,
    MCManager.Config,
    NapCat.Config,
  ]);

  // private mcSyncMsg: MinecraftQueQiao;
  public readonly mcsManager: MCManager;
  public readonly queQiaoAdapter: GLQueQiaoAdapter;
  public readonly napCat: NapCat;
  public readonly ali: AliYun;

  constructor(
    private ctx: Context,
    private config: GLBotConfigType,
  ) {
    // this.mcSyncMsg = new MinecraftQueQiao(ctx, config);
    this.mcsManager = new MCManager(this, ctx, config);
    this.queQiaoAdapter = new GLQueQiaoAdapter(this, ctx, config);
    console.log('in');

    this.napCat = new NapCat(ctx, config);
    this.ali = new AliYun('', '');
    const aliLocalDomain = new AliYunLocalDomain(this.ali);

    aliLocalDomain.updateMainDomainRecordInLocalIP();

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

      if (
        isEqual(session.content, '群群') &&
        !isEqual(session.event.selfId, session.event.user?.id)
      ) {
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
