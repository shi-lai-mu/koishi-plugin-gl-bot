import { isEqual } from 'lodash';
import { BotCommandBase } from '../../../gl/commands/base';
import { formatDuration } from '../../../utils';
import { MCSManagerBot } from '../../bot';
import {
  RemoteInstanceStatusEnum,
  RemoteInstanceStatusName,
} from '../../constants';

/**
 * 服务器列表指令
 *
 * @example 服务器 列表
 */
export class MCBotListCommand extends BotCommandBase {
  command: string[] = ['服务器.列表 <status>', 'MC.列表 <status>'];

  roles = [];

  constructor(public readonly bot: MCSManagerBot) {
    super(bot);
  }

  async readServerProperties(daemonId: string, instanceId: string) {
    return this.bot.panel.api.readServerProperties(daemonId, instanceId);
  }

  async handle(_, status?: string[]): Promise<string> {
    console.log(status);

    await this.bot.panel.handleRemoteServices();

    let filteredStatus = status?.at(0) ?? '运行中';

    if (filteredStatus === '全部') {
      filteredStatus = '';
    }

    const nameInstances = (
      await this.bot.panel.searchInstanceByName('')
    ).filter(
      item =>
        !filteredStatus ||
        ~item.instance.cfg.config.nickname.indexOf(filteredStatus) ||
        RemoteInstanceStatusName[item.instance.cfg.status] === filteredStatus,
    );

    const list = [];

    for (const item of nameInstances) {
      let properties = {};
      const { cfg } = item.instance;
      const lastDatetime = isEqual(cfg.status, RemoteInstanceStatusEnum.RUNNING)
        ? Date.now()
        : cfg.config.lastDatetime;

      const duration = formatDuration(
        lastDatetime - new Date(cfg.config.createDatetime).getTime(),
      );

      try {
        properties = await this.readServerProperties(
          item.remote.uuid,
          item.instance.cfg.instanceUuid,
        );
      } catch (err) {
        properties = {};
      }

      list.push(
        `- ${RemoteInstanceStatusName[cfg.status]} ${cfg.config.nickname} 「${duration}」[端口 ${properties?.['server-port'] || '--'}]`
          .replace('运行中', '✅')
          .replace('已停止', '❌'),
      );
    }

    return `${'='.repeat(10)}服务器列表${'='.repeat(10)}\n${list.join('\n')}\n ${'='.repeat(28)} `;
  }
}
