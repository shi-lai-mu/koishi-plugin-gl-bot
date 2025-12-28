import { Schema } from 'koishi';

export class MCManagerConfig {
  static Base = Schema.object({
    mcManagerUsername: Schema.string().default('admin').description('用户名'),
    mcManagerPassword: Schema.string()
      .role('secret')
      .default('admin')
      .description('密码'),
    mcManagerKey: Schema.string().role('secret').description('KEY'),
    mcManagerHost: Schema.string()
      .default('http://localhost:23333/api')
      .description('地址'),
    mcManagerWs: Schema.string()
      .default('ws://localhost:24444')
      .description('WebSocket 地址'),
    mcManagerMaxConnectWs: Schema.number()
      .default(20)
      .description('最大连接实例数'),
  }).description('MCSMANAGER 基础配置');
}
