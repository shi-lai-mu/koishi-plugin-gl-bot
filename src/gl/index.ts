import { Context, Logger, Schema } from 'koishi';

import { IS_DEV } from '../constants';
import MinecraftSyncMsg from '../queQiao';
import { Config } from './type';

const logger = new Logger('gl-bot');

export class GLBot {
  static Config: Schema<Config> = Schema.intersect([MinecraftSyncMsg.Config]);

  private mcSyncMsg: MinecraftSyncMsg;

  constructor(
    private ctx: Context,
    private config: Config,
  ) {
    this.mcSyncMsg = new MinecraftSyncMsg(this.ctx, this.config);
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
        session.send(`群群是笨蛋！大笨蛋喵`);
      }
    });
  }
}
