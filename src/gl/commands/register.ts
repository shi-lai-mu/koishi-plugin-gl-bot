import { BotCommandBase } from './base';

export class GLCommandRegister {
  // 注册的指令列表
  static commands: Record<string, BotCommandBase> = {};

  // 主指令列表
  static mainCommands: Set<string> = new Set();

  // 指令正则表达式列表
  static commandRegExp: Record<string, RegExp> = {};
}
