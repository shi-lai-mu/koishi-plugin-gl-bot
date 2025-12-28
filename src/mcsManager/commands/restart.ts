import { Context, Session } from 'koishi';

import { MCSManagerBot } from '../bot';
import {
  RemoteInstanceStatusEnum,
  RemoteInstanceStatusName,
} from '../constants';

// const logger = new Logger('mcsmanager-reset');

const tempSelections = new Map<number, string>();

/**
 * 服务器重启指令
 *
 * @example 服务器 重启 神话
 */
export class MCBotRestartCommand {
  constructor(private readonly bot: MCSManagerBot) {
    bot.ctx
      .command('服务器.重启 <name...>')
      .action(async ({ session }, ...name) => {
        return await this.handle(session, name.join(' '));
      });
  }

  async handle(
    session: Session<never, never, Context>,
    name: string,
  ): Promise<string> {
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
      return `未找到名称包含 "${name}" 的服务器实例`;
    }

    if (nameInstances.length > 1 && selectIndex === -1) {
      tempSelections.set(userId, name);
      return `请输入序号以选择:\n\n${nameInstances
        .map(
          (item, index) =>
            `${index + 1}. [${RemoteInstanceStatusName[item.instance.cfg.status]}] ${item.instance.cfg.config.nickname}`,
        )
        .join('\n')}\n ==== 例如发送： (服务器 重启 1) ====`;
    }

    const targetInstance =
      selectIndex !== -1 ? nameInstances[selectIndex] : nameInstances[0];

    if (!targetInstance || !targetInstance.instance) {
      return `未找到名称包含 "${name}" 的服务器实例`;
    }

    const { cfg } = targetInstance.instance;

    switch (cfg.status) {
      // 关闭状态：启动
      case RemoteInstanceStatusEnum.RUNNING:
        await targetInstance.instance.restartInstance();
        this.bot.panel.handleRemoteServices();
        return `已向服务器实例 "${cfg.config.nickname}" 发送重启操作`;

      // 启动状态：重启
      case RemoteInstanceStatusEnum.STOPPED:
        await targetInstance.instance.startInstance();
        this.bot.panel.handleRemoteServices();
        return `已向服务器实例 "${cfg.config.nickname}" 发送启动操作`;

      default:
        return `服务器实例 "${cfg.config.nickname}" 当前状态为 ${cfg.status}，无法执行重启操作`;
    }
  }
}
