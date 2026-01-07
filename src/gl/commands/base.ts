import { Argv, Logger } from 'koishi';

import { MCSManagerBot } from '../../mcsManager/bot';

const logger = new Logger('mcsmanager-command');

export enum BotCommandRole {
  /** 群主 */
  Owner = 'owner',
  /** 管理员 */
  Admin = 'admin',
  /** 成员 */
  Member = 'member',
  /** 所有人 */
  All = 'all',
}

export abstract class BotCommandBase {
  abstract command: string[];

  abstract roles: BotCommandRole[];

  constructor(public readonly bot: MCSManagerBot) {}

  // 鉴定权限
  public async authenticate(cmd: Argv, args: string[]) {
    // console.log(cmd.session.event);
    const userRole = cmd.session.event.member?.roles?.at(0);
    if (
      this.roles.length > 0 &&
      !this.roles.includes(userRole as BotCommandRole)
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
