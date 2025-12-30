import { formatDuration } from '../../../utils';
import { MCSManagerBot } from '../../bot';
import { RemoteInstanceStatusName } from '../../constants';
import { BotCommandBase, BotCommandRole } from '../base';

/**
 * 服务器列表指令
 *
 * @example 服务器 列表
 */
export class ARKBotListCommand extends BotCommandBase {
  command: string[] = ['方舟.列表 <status>', 'ARK.列表 <status>'];

  roles = [BotCommandRole.All];

  constructor(public readonly bot: MCSManagerBot) {
    super(bot);
    this.initialize();
  }

  async handle(_, status?: string[]): Promise<string> {
    await this.bot.panel.handleRemoteServices();

    const filteredStatus = status?.at(0);
    const nameInstances = (
      await this.bot.panel.searchInstanceByName('')
    ).filter(
      item =>
        !filteredStatus ||
        RemoteInstanceStatusName[item.instance.cfg.status] === filteredStatus,
    );

    return `${'='.repeat(10)}服务器列表${'='.repeat(10)}\n${nameInstances
      .map(item => {
        const { cfg } = item.instance;
        const duration = formatDuration(
          cfg.config.lastDatetime -
            new Date(cfg.config.createDatetime).getTime(),
        );
        return `- [${RemoteInstanceStatusName[cfg.status]}] ${cfg.config.nickname} 「${duration}」`;
      })
      .join('\n')}\n ${'='.repeat(28)} `;
  }
}
