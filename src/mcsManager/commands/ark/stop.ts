import { Argv } from 'koishi';
import { isEqual, isString } from 'lodash';

import { MCSManagerBot } from '../../bot';
import {
  RemoteInstanceStatusEnum,
  RemoteInstanceStatusName,
} from '../../constants';
import { BotCommandBase, BotCommandRole } from '../base';

const tempSelections = new Map<number, string>();

/**
 * 服务器关闭指令
 *
 * @example 服务器 关闭 神话
 */
export class ARKBotStopCommand extends BotCommandBase {
  command: string[] = ['方舟.关闭 <name...>', 'ARK.关闭 <name...>'];

  roles = [BotCommandRole.All];

  constructor(public readonly bot: MCSManagerBot) {
    super(bot);
    this.initialize();
  }

  async handle({ session }: Argv, args: string[]) {
    let name = isString(args) ? args : args.join(' ');
    let selectIndex = -1;
    const userId = Number(session.event.user.id);

    // 溯源前搜索项
    if (tempSelections.has(userId) && !isNaN(Number(name))) {
      selectIndex = Number(name) - 1;
      name = tempSelections.get(userId)!;
    }

    tempSelections.delete(userId);

    const nameInstances = await this.bot.panel.searchInstanceByName(name);

    if (nameInstances.length === 0) {
      return `未找到名称包含 "${name}" 的服务器`;
    }

    if (nameInstances.length > 1 && selectIndex === -1) {
      tempSelections.set(userId, name);
      return `请输入序号以选择:\n\n${nameInstances
        .map(
          (item, index) =>
            `${index + 1}. [${RemoteInstanceStatusName[item.instance.cfg.status]}] ${item.instance.cfg.config.nickname}`,
        )
        .join('\n')}\n ==== 例如发送： (服务器 关闭 1) ====`;
    }

    const targetInstance =
      selectIndex !== -1 ? nameInstances[selectIndex] : nameInstances[0];

    if (!targetInstance || !targetInstance.instance) {
      return `未找到名称包含 "${name}" 的服务器`;
    }

    const { cfg } = targetInstance.instance;

    if (isEqual(cfg.status, RemoteInstanceStatusEnum.RUNNING)) {
      await targetInstance.instance.stopInstance();
      this.bot.panel.handleRemoteServices();
      return `已向服务器实例 "${cfg.config.nickname}" 发送关闭操作`;
    }

    return `服务器实例 "${cfg.config.nickname}" 当前状态为 ${cfg.status}，无法执行关闭操作`;
  }
}
