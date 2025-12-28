import { Context, Logger } from 'koishi';
import { GLBotConfigType } from '../../gl';

export { MCBotListCommand } from './list';
export { MCBotRestartCommand } from './restart';
export { MCBotStartCommand } from './start';

const logger = new Logger('mcsmanager-command');

export class MCBotCommandBase {
  constructor(
    public readonly ctx: Context,
    public readonly config: GLBotConfigType,
  ) {
    // logger.info('注册 MCSManager 服务器管理指令...');
  }
}
