import Alidns20150109 from '@alicloud/alidns20150109';
import * as $OpenApi from '@alicloud/openapi-client';

export class AliYunAccessService {
  // 单例模式
  static instance: Alidns20150109;

  /**
   * 使用AK&SK初始化账号Client
   * @param accessKeyId
   * @param accessKeySecret
   * @return Client
   * @throws Exception
   */
  static createClient(
    accessKeyId?: string,
    accessKeySecret?: string,
  ): Alidns20150109 {
    if (AliYunAccessService.instance) {
      return AliYunAccessService.instance;
    }

    const config = new $OpenApi.Config({
      accessKeyId: accessKeyId ?? process.env.ALI_YUN_ACCESS_KEY_ID,
      accessKeySecret: accessKeySecret ?? process.env.ALI_YUN_ACCESS_KEY_SECRET,
    });
    // 访问的域名
    config.endpoint = `alidns.cn-hangzhou.aliyuncs.com`;

    AliYunAccessService.instance = new Alidns20150109(config);

    return AliYunAccessService.instance;
  }
}
