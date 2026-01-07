import { Schema } from 'koishi';

export class GLConfig {
  static Base = Schema.object({
    cmdRegisterMode: Schema.boolean()
      .default(false)
      .description('命令注册模式 指令模式/关键词模式'),
  }).description('MCSMANAGER 基础配置');
}
