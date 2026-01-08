import { Context } from 'koishi';
import { GLBot, GLBotConfigType } from '.';
import MinecraftQueQiao from '../queQiao';

export class GLQueQiaoAdapter {
  servers: Record<string, MinecraftQueQiao> = {};

  constructor(
    public readonly gl: GLBot,
    public readonly ctx: Context,
    private readonly config: GLBotConfigType,
  ) {
    if (this.config.queQiaoEnable) {
      this.initialize();
    }
  }

  private initialize() {
    // this.config.queQiaoServers?.forEach(serverConfig => {
    //   if (serverConfig.enable) {
    //     const [wsHost, wsProt] =
    //       serverConfig.wsHost.split(':') ?? serverConfig.wsProt;
    //     const [rconHost, rconProt] =
    //       serverConfig.rconServerHost.split(':') ?? serverConfig.rconServerHost;
    //     this.servers[serverConfig.serverName] = new MinecraftQueQiao(
    //       this.ctx,
    //       this,
    //       {
    //         rconEnable: serverConfig.rconEnable,
    //         rconServerHost: rconHost ?? serverConfig.rconServerHost,
    //         rconServerPort: rconProt ?? serverConfig.rconServerPort,
    //         rconPassword: serverConfig.rconPassword,
    //         wsServer: '客户端',
    //         wsHost: wsHost ?? serverConfig.wsHost,
    //         wsPort: wsProt ?? serverConfig.wsPort,
    //         Token: serverConfig.Token,
    //         serverName: serverConfig.serverName,
    //         // event: [],
    //         sendToChannel: this.config.queQiaoSendToChannel,
    //         watchChannel: this.config.queQiaoWatchChannel,
    //       },
    //     );
    //   }
    // });
  }
}
