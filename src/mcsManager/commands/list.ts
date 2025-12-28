import { MCSManagerBot } from '../bot';
import { RemoteInstanceStatusName } from '../constants';

/**
 * 服务器列表指令
 *
 * @example 服务器 列表
 */
export class MCBotListCommand {
  constructor(private readonly bot: MCSManagerBot) {
    bot.ctx.command('服务器.列表 <status>').action(async (_, status) => {
      return await this.handle(status);
    });
  }

  async handle(status?: string): Promise<string> {
    await this.bot.panel.handleRemoteServices();

    const nameInstances = (
      await this.bot.panel.searchInstanceByName('')
    ).filter(
      item =>
        !status ||
        RemoteInstanceStatusName[item.instance.cfg.status] === status,
    );

    return `${'='.repeat(10)}服务器列表${'='.repeat(10)}\n${nameInstances
      .map(
        (item, index) =>
          `${index + 1}. [${RemoteInstanceStatusName[item.instance.cfg.status]}] ${item.instance.cfg.config.nickname}`,
      )
      .join('\n')}\n ${'='.repeat(20)} `;
  }
}
