import { getLocalNetworkActive } from '../utils/huawei';
import { AliYun } from './client';
import { DomainRecordsExplorerType } from './type';

export class AliYunLocalDomain {
  static readonly watchDomains = {
    'gleamslime.com': {
      RRs: ['vpn'],
    },
  };

  constructor(private readonly ali: AliYun) {}

  /** 定位子域名解析记录 为本机ip */
  async updateMainDomainRecordInLocalIP(routerPwd?: string) {
    const getNetwork = routerPwd ? await this.getClientIP(routerPwd) : null;
    const fetchIP = getNetwork?.ident === 'huawei' ? getNetwork?.ip : '';
    const [IP] = fetchIP?.match?.(
      /(?<=\s(\(|\[))(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?=\)|\])/,
    ) || [fetchIP];
    // console.log({ IP, fetchIP, getNetwork });

    const updateList: [string, string][] = [];
    Object.entries(AliYunLocalDomain.watchDomains).forEach(
      ([domainName, { RRs }]) =>
        updateList.push(...RRs.map(RR => [domainName, RR] as [string, string])),
    );

    if (IP) {
      const result = (
        await Promise.all(
          await updateList.map(
            async ([updateDomain, RR]) =>
              await this.ali.updateDomainRecord(
                updateDomain,
                RR,
                DomainRecordsExplorerType.A,
                IP,
              ),
          ),
        )
      ).some(v => v);
      return result;
    }
  }
  /**
   * 获取本机外网IP
   */
  async getClientIP(routerPwd?: string, isDebug = false) {
    const topGetIP = await getLocalNetworkActive(routerPwd);
    if (topGetIP) {
      return { ident: 'huawei', ip: topGetIP.IPv4Addr };
    }

    // const IPRegExp = /\d{1,}\.\d{1,}\.\d{1,}\.\d{1,}/g
    // const getContentIP = (text: string, name) => {
    //   const ip = (text.match(IPRegExp) || [])[0]
    //   isDebug && console.log(`[GetClientIP-DeBug]: `, { name, ip, text })
    //   return ip
    // }

    // // const fetchSohu = async () =>
    // //   await axios.get('http://pv.sohu.com/cityjson').then(res => getContentIP(res.data, 'fetchSohu'))

    // const fetchL2 = async () =>
    //   await $axios.get('http://l2.io/ip.js').then(res => getContentIP(res.data, 'fetchL2'))

    // const fetchIpinfo = async () =>
    //   await $axios
    //     .get('https://ipinfo.io/json?callback=recordData')
    //     .then(res => getContentIP(res.data, 'fetchIpinfo'))

    // const fetchIp138 = async () =>
    //   await $axios.get('https://2022.ip138.com/').then(res => getContentIP(res.data, 'fetchIp138'))

    // return /*fetchSohu() || */ {
    //   ident: 'other',
    //   ip: (await fetchL2()) || (await fetchIpinfo()) || (await fetchIp138()),
    // }
  }
}
