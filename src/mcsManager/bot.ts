import { Context } from 'koishi';
import { MCManager } from '.';
import { GLBotConfigType } from '../gl';
import {
  ARKBotListCommand,
  ARKBotRestartCommand,
  ARKBotStartCommand,
  ARKBotStopCommand,
  MCBotListCommand,
  MCBotOnlineTimeCommand,
  MCBotRestartCommand,
  MCBotStartCommand,
  MCBotStopCommand,
} from './commands';
import { MCBotCreateCommand } from './commands/mc/create';
import { MCSManagerPanel } from './panel';

export class MCSManagerBot {
  constructor(
    public readonly manager: MCManager,
    public readonly ctx: Context,
    public readonly config: GLBotConfigType,
    public readonly panel: MCSManagerPanel,
  ) {
    this.initialize();
  }

  public help() {
    return [
      '服务器 管理指令：',
      '/服务器 列表',
      '/服务器 开启 <模糊名>',
      '/服务器 关闭 <模糊名>',
      '/服务器 重启 <模糊名>',
      '/服务器 备份 <模糊名>',
    ];
  }

  public commands() {
    return [
      MCBotRestartCommand,
      MCBotListCommand,
      MCBotStartCommand,
      MCBotStopCommand,
      MCBotCreateCommand,
      MCBotOnlineTimeCommand,

      ARKBotListCommand,
      ARKBotRestartCommand,
      ARKBotStartCommand,
      ARKBotStopCommand,
    ];
  }

  async initialize() {
    this.ctx.on('ready', async () => {
      this.registerCommands();
    });
  }

  private registerCommands() {
    for (const Command of this.commands()) {
      const _ = new Command(this);
    }
  }
}
