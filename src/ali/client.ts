import * as $Alidns20150109 from '@alicloud/alidns20150109';
import * as $Util from '@alicloud/tea-util';
import dayjs from 'dayjs';
import { Logger } from 'koishi';
import { AliYunAccessService } from '.';
import { IS_DEV } from '../constants';
import { DomainRecordsExplorerType } from './type';

const logger = new Logger('GL');

export class AliYun {
  constructor(
    public readonly accessKeyId?: string,
    public readonly accessKeySecret?: string,
  ) {}

  /** 获取 域名列表 */
  async fetchDomainList() {
    const client = AliYunAccessService.createClient(
      this.accessKeyId,
      this.accessKeySecret,
    );
    const describeDomainsRequest = new $Alidns20150109.DescribeDomainsRequest(
      {},
    );
    const runtime = new $Util.RuntimeOptions({});

    try {
      const { body } = await client.describeDomainsWithOptions(
        describeDomainsRequest,
        runtime,
      );

      return body;
    } catch (error) {
      console.error(error);
    }
  }

  /** 获取 解析记录 列表 */
  async fetchDomainRecords(
    domainName: string,
  ): Promise<$Alidns20150109.DescribeDomainRecordsResponseBody | null> {
    const client = AliYunAccessService.createClient(
      this.accessKeyId,
      this.accessKeySecret,
    );
    const describeDomainRecordsRequest =
      new $Alidns20150109.DescribeDomainRecordsRequest({
        domainName,
      });
    const runtime = new $Util.RuntimeOptions({});
    try {
      const { body } = await client.describeDomainRecordsWithOptions(
        describeDomainRecordsRequest,
        runtime,
      );
      return body;
    } catch (error) {
      return null;
    }
  }

  /** 定位 子域名解析记录 */
  async findSubDomainRecords(
    domainName: string,
    RR: string,
  ): Promise<$Alidns20150109.DescribeDomainRecordsResponseBodyDomainRecordsRecord | null> {
    const records = await this.fetchDomainRecords(domainName);
    return records?.domainRecords?.record.find(item => {
      if (item.RR === RR) {
        return item;
      }
      return false;
    });
  }

  /** 更新 解析记录 备注 */
  async updateDomainRecordRemarkRequest(
    recordId: string,
    remark: string,
  ): Promise<$Alidns20150109.UpdateDomainRecordRemarkResponseBody | null> {
    const client = AliYunAccessService.createClient(
      this.accessKeyId,
      this.accessKeySecret,
    );
    const UpdateDomainRecordRemarkRequest =
      new $Alidns20150109.UpdateDomainRecordRemarkRequest({
        recordId,
        remark,
      });
    const runtime = new $Util.RuntimeOptions({});
    try {
      const { body } = await client.updateDomainRecordRemarkWithOptions(
        UpdateDomainRecordRemarkRequest,
        runtime,
      );

      return body;
    } catch (error) {
      return null;
    }
  }

  /** 更新 子域名 解析记录 */
  async updateDomainRecord(
    domainName: string,
    RR: string,
    type: DomainRecordsExplorerType,
    value: string,
  ) {
    const findDomain = await this.findSubDomainRecords(domainName, RR);

    if (IS_DEV) {
      console.log({ domainName, RR, type, value, findDomain });
    }

    if (type === undefined || value === undefined || !findDomain) {
      return false;
    }

    // 如果解析值相同则跳出更新
    if (findDomain.value === value && findDomain.type === type) {
      return true;
    }

    // console.log({ value })
    const recordId = findDomain.recordId;
    const client = AliYunAccessService.createClient(
      this.accessKeyId,
      this.accessKeySecret,
    );
    const updateDomainRecordRequest =
      new $Alidns20150109.UpdateDomainRecordRequest({
        recordId,
        RR,
        type,
        value,
      });

    const runtime = new $Util.RuntimeOptions({});
    try {
      const { body } = await client.updateDomainRecordWithOptions(
        updateDomainRecordRequest,
        runtime,
      );

      logger.info(
        `[AIAuthUpdateRecord]: ${RR}.${domainName} 授权OK...${value}`,
      );

      // Logger.custom('schedule').trace(`[${domainName}域名解析更新]: `, body)
      // console.log(value)

      // QQbot?.findGuild(QQ_GUILD.ISCS.child['变更通知'])?.sendMessage([
      //   `[${RR}.${domainName}域名解析更新]: ${value}`,
      // ])
      //   const channel = QQbot?.findGuild(QQ_GUILD.ISCS.child['变更通知']);
      //   QQRobot.reply(
      //     channel,
      //     `[${RR}.${domainName}域名解析更新]: ${value}`,
      //     text => channel?.sendMessage(text as Sendable),
      //   );

      await this.updateDomainRecordRemarkRequest(
        recordId,
        `${dayjs().format('YYYY-MM-DD HH-mm-ss')}更新`,
      );

      return body;
    } catch (error) {
      return null;
    }
  }
}
