import { Schema } from 'koishi';

export class GLConfig {
  static Base = Schema.object({
    cmdRegisterMode: Schema.boolean()
      .default(false)
      .description('命令注册模式 指令模式/关键词模式'),
  }).description('GL 基础配置');

  static Extends = Schema.object({
    authKey: Schema.string().role('secret').description('AI服务授权密钥'),
    authID: Schema.string().role('secret').description('AI服务授权ID'),
    authSecret: Schema.string().role('secret').description('AI服务授权密钥2'),
    authDomain: Schema.string().description('AI服务授权域名'),
    authChildDomain: Schema.array(String).description('AI服务授权子域名'),
  }).description('GL 拓展配置');
}
