import { Context, Logger, Schema } from "koishi";

import { Config } from "./type";
import MinecraftSyncMsg from "../queQiao";

const logger = new Logger("gl-bot");

export class GLBot {
  
  static Config: Schema<Config> = Schema.intersect([
    MinecraftSyncMsg.Config,
  ]);

  constructor(private ctx: Context, private config: Config) {
    console.log(config);
    this.initialize();
  }

  private initialize() {
    new MinecraftSyncMsg(this.ctx, this.config);
    this.globalCommand();
  }

  private globalCommand() {
    this.ctx.on("message", (session) => {
      switch (session.content) {
        case '环境变量':
          session.send(`当前环境变量：${Object.entries(process.env).map(([k, v]) => `${k}: ${v}`).join('\n')}`);
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
