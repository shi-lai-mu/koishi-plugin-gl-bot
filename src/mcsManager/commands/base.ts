import { Argv, Logger } from 'koishi';
import { MCSManagerBot } from '../bot';

const logger = new Logger('mcsmanager-command');

export abstract class MCBotCommandBase {
  abstract command: string;

  constructor(public readonly bot: MCSManagerBot) {}

  protected initialize() {
    logger.info(`注册 MCSManager ${this.command} 指令...`);
    this.bot.ctx.command(this.command).action(async (cmd, ...args) => {
      return await this.handle(cmd, args);
    });
  }

  abstract handle?(cmd: Argv, args: string[]): Promise<string>;
}
