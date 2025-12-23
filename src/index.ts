import { Context, Schema } from "koishi";
import { resolve } from "path";
import {} from "@koishijs/plugin-console";
import queQiaoPlugin from "./queQiao";

export const name = "gl-bot";

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.inject(["console"], (ctx) => {
    ctx.console.addEntry({
      dev: resolve(__dirname, "../client/index.ts"),
      prod: resolve(__dirname, "../dist"),
    });
    ctx.on("message", (session) => {
      if (session.content && ~session.content.indexOf("群群")) {
        session.send("群群是笨蛋！大笨蛋喵");
      }
    });
    ctx.on("message", (session) => {
      if (session.content && ~session.content.indexOf("version")) {
        session.send(JSON.stringify(process.versions));
      }
    });

    const queQiaoConfig = new queQiaoPlugin.Config();
    const connectHost = "mc.gleamslime.com";

    queQiaoConfig.wsHost = connectHost;
    queQiaoConfig.wsPort = 8181;
    queQiaoConfig.serverName = "demo";
    queQiaoConfig.Token = "123456";

    queQiaoConfig.rconServerHost = connectHost;
    queQiaoConfig.rconPassword = "123456";

    new queQiaoPlugin(ctx, queQiaoConfig);
  });
}
