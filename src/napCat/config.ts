import { Schema } from 'koishi';

export class NapCatConfig {
  static Base = Schema.object({
    napCatBaseUrl: Schema.string()
      .default('http://localhost:3000')
      .description('地址'),
    napCatToken: Schema.string()
      .role('secret')
      .default('admin')
      .description('密码'),
  }).description('NapCat 基础配置');
}
