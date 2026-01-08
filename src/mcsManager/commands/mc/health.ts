import { isNumber } from 'lodash';
import { BotCommandBase } from '../../../gl/commands/base';
import MinecraftQueQiao from '../../../queQiao';
import { MCSManagerBot } from '../../bot';

/**
 * 服务器 健康 指令
 *
 * @example 服务器 健康
 */
export class MCBotHealthCommand extends BotCommandBase {
  command: string[] = ['服务器.健康 <status>', 'MC.健康 <status>'];

  roles = [];

  constructor(public readonly bot: MCSManagerBot) {
    super(bot);
  }

  async getHealthStatus(connect: MinecraftQueQiao) {
    const healths = [];

    if (!connect.rcon || !connect.rcon.authenticated) {
      return healths;
    }

    // FIXME: 此处需适配
    const result = await connect.sendRconCommand('forge tps');
    // Overall: Mean tick time: 3.314 ms. Mean TPS: 20.000
    const [, tickTimeMatch, tpsMatch] =
      result.match(/Mean tick time: ([\d.]+) ms\. Mean TPS: ([\d.]+)/) || [];

    if (tickTimeMatch && isNumber(Number(tickTimeMatch))) {
      healths.push(
        `Tick：${Number(tickTimeMatch).toFixed(2)} ms [${Number(tickTimeMatch) <= 50 ? '优秀' : '过高'}]`,
      );
    }

    if (tpsMatch && isNumber(Number(tpsMatch))) {
      healths.push(
        `TPS：${Number(tpsMatch).toFixed(2)} [${Number(tpsMatch) >= 15 ? '优秀' : '过低'}]`,
      );
    }

    return healths;
  }

  async handle(_, status?: string[]): Promise<string> {
    const result = ['服务器 健康 状态：'];

    for (const [name, server] of Object.entries(
      this.bot.manager.gl.queQiaoAdapter.servers,
    )) {
      const headers = await this.getHealthStatus(server);
      const queQIaoConnected = server.ws?.readyState === 1;

      result.push(
        `- [${name}] 互通：${queQIaoConnected ? 'OK' : 'NO'} | 后端：${server.rcon.authenticated ? 'OK' : 'NO'} | ${headers.join(' | ')}`,
      );
    }

    return result.join('\n');
  }
}
