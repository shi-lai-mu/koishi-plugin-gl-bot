import { Argv, Logger } from 'koishi';

import { IS_DEV } from '../../constants';
import { MCSManagerBot } from '../bot';

const logger = new Logger('mcsmanager-command');

export enum MCBotCommandRole {
  Admin = 'admin',
  Owner = 'owner',
}

export abstract class MCBotCommandBase {
  abstract command: string[];

  abstract roles: MCBotCommandRole[];

  constructor(public readonly bot: MCSManagerBot) {}

  protected initialize() {
    if (IS_DEV) {
      logger.info(`注册 MCSManager ${this.command} 指令...`);
    }

    for (const cmdStr of this.command) {
      this.bot.ctx.command(cmdStr).action(async (argv, ...args) => {
        return await this.authenticate(argv, args);
      });
    }
  }

  // 鉴定权限
  async authenticate(cmd: Argv, args: string[]) {
    // console.log(cmd.session.event);
    const userRole = cmd.session.event.member?.roles?.at(0);
    if (
      this.roles.length > 0 &&
      !this.roles.includes(userRole as MCBotCommandRole)
    ) {
      logger.error(
        `用户 ${cmd.session.event.user.id}[${userRole}] 没有权限使用指令 ${this.command}`,
      );
      return '您没有权限使用此指令。';
    }

    return await this.handle?.(cmd, args);
  }

  abstract handle?(cmd: Argv, args: string[]): Promise<string>;
}
