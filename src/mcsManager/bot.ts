import { Context } from 'koishi';
import { GLBotConfigType } from '../gl';
import {
  MCBotListCommand,
  MCBotRestartCommand,
  MCBotStartCommand,
} from './commands';
import { MCSManagerPanel } from './panel';

export class MCSManagerBot {
  constructor(
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
    return [MCBotRestartCommand, MCBotListCommand, MCBotStartCommand];
  }

  async initialize() {
    this.ctx.on('ready', async () => {
      this.registerCommands();
    });
  }

  private registerCommands() {
    for (const Command of this.commands()) {
      new Command(this);
    }

    // this.ctx
    //   .command('/服务器 <action> [...name]')
    //   .option('debug', '-d')
    //   .action(({ options }, action, ...name) => {
    //     return `收到指令：${action} ${name.join(' ')}，调试模式：${options.debug}`;
    //   });
  }
}
