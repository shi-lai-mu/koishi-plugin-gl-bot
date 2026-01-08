import { $axios } from './axios';
import { CryptoJS } from './cat_enc';

let csrf_param = '';
let csrf_token = '';
let csrf_cookie = '';
let unlockInterval = null;

const scram = CryptoJS.SCRAM({ keySize: 8 });
const firstNonce = scram.nonce().toString();
const { HUAWEI_API, HUAWEI_USER, HUAWEI_PASSWORD } = {
  HUAWEI_API: 'http://192.168.3.1',
  HUAWEI_USER: 'admin',
  HUAWEI_PASSWORD: '',
};
const isDebug = false;

const request = async <T>(url, data: unknown, method: 'post' | 'get') => {
  const cfg = {
    headers: {
      cookie: csrf_cookie,
      log: isDebug,
    },
  };
  const res = await $axios[method]<T & Csrf>(
    `${HUAWEI_API}${url}`,
    method === 'post'
      ? {
          data,
          csrf: {
            csrf_param,
            csrf_token,
          },
        }
      : cfg,
    method === 'post' ? cfg : null,
  );

  if (res?.data) {
    csrf_param = res?.data.csrf_param;
    csrf_token = res?.data.csrf_token;
  }
  const cookie = res?.headers?.['set-cookie']?.[0]?.split?.(' ')?.[0];
  if (cookie) {
    csrf_cookie = cookie;
  }

  return res?.data as T;
};

export const getLocalNetworkActive = async () => {
  console.log({ csrf_cookie });

  if (!csrf_cookie) await getLocalNetwork();
  return await request<Active>('/api/ntwk/wan?type=active', null, 'get');
};

/**
 * 获取本地设备信息
 */
export const getLocalNetwork = async () => {
  const nonce = await userLoginNonce();
  const salt = CryptoJS.enc.Hex.parse(nonce.salt);
  const iter = nonce.iterations;
  const finalNonce = nonce.servernonce;
  const authMsg = firstNonce + ',' + finalNonce + ',' + finalNonce;
  const saltPassword = scram
    .saltedPassword(HUAWEI_PASSWORD, salt, iter)
    .toString();
  const serverKey = scram.serverKey(CryptoJS.enc.Hex.parse(saltPassword));

  let clientKey = scram
    .clientKey(CryptoJS.enc.Hex.parse(saltPassword))
    .toString();
  let storekey = scram.storedKey(CryptoJS.enc.Hex.parse(clientKey));
  storekey = storekey.toString();
  let clientsignature = scram.signature(
    CryptoJS.enc.Hex.parse(storekey),
    authMsg,
  );
  clientsignature = clientsignature.toString();
  clientsignature = CryptoJS.enc.Hex.parse(clientsignature);
  clientKey = CryptoJS.enc.Hex.parse(clientKey);
  for (let i = 0; i < clientKey.sigBytes / 4; i++) {
    clientKey.words[i] = clientKey.words[i] ^ clientsignature.words[i];
  }
  const account = await request<Account>(
    '/api/system/user_login_proof',
    {
      clientproof: clientKey.toString(),
      finalnonce: finalNonce,
    },
    'post',
  );

  const active = await request<Active>(
    '/api/ntwk/wan?type=active',
    null,
    'get',
  );

  if (!unlockInterval) {
    // 重复刷新token 5分钟过期
    unlockInterval = setInterval(() => {
      csrf_param = '';
      csrf_token = '';
      csrf_cookie = '';
      getLocalNetwork();
    }, 45000);
  }

  return {
    account,
    active,
    csrf_param,
    csrf_token,
    csrf_cookie,
  };
};

export const userLoginNonce = () => {
  return new Promise<Nonce>(async (res, rej) => {
    const { data: loginPage } =
      (await $axios.get(`${HUAWEI_API}/html/index.html#/login`)) || {};
    if (typeof loginPage === 'string') {
      // 获取页面上的csrf
      csrf_param = loginPage.match(
        /\<meta name="csrf_param"\s+content="(\S+)"/,
      )?.[1];
      csrf_token = loginPage.match(
        /\<meta name="csrf_token"\s+content="(\S+)"/,
      )?.[1];

      const loginNonce = async (loginCount = 0) => {
        const data = await request<Nonce>(
          '/api/system/user_login_nonce',
          {
            username: HUAWEI_USER,
            firstnonce: firstNonce,
          },
          'post',
        );
        if (!data || data.errcode) {
          if (loginCount < 5) {
            loginNonce(++loginCount);
          } else {
            return rej('重试次数超出5次');
          }
        } else {
          return res(data);
        }
      };
      loginNonce();
    }
  });
};

type Nonce = {
  servernonce: 'b93b7c38616dc791458f614191da7e6c9f5129344d9cfa7488225ec54a33d047rEUzZZzlRjv0kEpuQ0iWXQIX0KiVs0Jy';
  isopen: 0;
  modeselected: 1;
  err: 0;
  iterations: 100;
  salt: '539814efa4b88147eaa23e037d2b437dc146c468e2704dcd5c8ff459ff6970aa';
  errcode: 0;
} & Csrf;

type Csrf = {
  csrf_param: '49vcBG0WnLbwdepqXxgXIc9OZA7l0XqZ';
  csrf_token: 'MMwD8c4z1IdfaODBO7VQIim6pISyzcrW';
};

type Active = {
  ConnectionType: 'PPP_Routed';
  ConnectionStatus: 'Connected';
  IPv6ConnectionStatus: 'Connected';
  ServiceList: 'INTERNET';
  MTU: 1500;
  WanType: 'PPP_Routed';
  MSS: 0;
  NATType: 1;
  PPPAuthMode: 'AUTO';
  DownBandwidth: 0;
  IPv4AddrType: 'DHCP';
  accessAuthEnable: false;
  IPv4Addr: '125.121.226.111';
  UpBandwidthMax: 115631;
  IPv4Mask: '255.255.255.0';
  PPPoEACName: 'HZ-HZ-HX-BAS-1.MAN.M6000S';
  IPv4Gateway: '125.121.224.1';
  IsConfigured: 1;
  IPv4DnsServers: '202.101.172.35,202.101.172.47';
  DNSOverrideAllowed: false;
  IPv6Enable: true;
  IPv4StaticMask: '255.255.255.0';
  AccessStatus: 'Up';
  IPv4StaticGateway: '';
  ID: 'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.';
  IPv6Gateway: 'fe80::ce1a:faff:feee:dcc5';
  IPv4StaticDnsServers: '';
  IPv6DnsServers: '240e:1c:200::1,240e:1c:200::2';
  IPv4StaticAddr: '';
  IPv6PrefixList: '240e:0390:0000:e4f0::/64';
  accessDevNum: 0;
  UpBandwidthHistory: '210,340,207,223,230,203,234,140,13,0,7,10,0,0,0,0,0,0,0,0,0,4,1,2,1,5,12,0,17,0,0,8,14,8,17,14,0,22,7,3,0,3,5,99,228,205,175,210,191,208,225,211,253,155,230,351,252,240,174,60';
  DownBandwidthHistory: '19,18,18,18,21,19,6,0,0,0,3,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,14,0,0,0,0,2,1,1,0,14,0,2,0,0,6,16,18,18,18,28,25,18,19,18,19,20,18,19,19,9,0,0';
  BandwidthTime: '370,372,374,376,378,380,382,384,386,388,390,392,394,396,398,400,402,404,406,408,410,412,414,416,418,420,422,424,426,428,430,432,434,436,438,440,442,444,446,448,450,452,454,456,458,460,462,464,466,468,470,472,474,476,478,480,482,484,486,488';
  DownBandwidthMax: 102682;
  IsDefault: 1;
  UpBandwidth: 60;
  MACColone: '';
  PPPoEServiceName: '';
  MACColoneEnable: false;
  IPv6AddrPrefixLen: 64;
  IPv6AddrSet: '240e:390:40:79e:5e78:f872:70de:f77e';
  X_SpeDialMode: 0;
  Username: '057164365909';
  LowerLayer: 'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.';
  MRU: 1492;
  IPv6Addr: '240e:390:40:79e:5e78:f872:70de:f77e/64';
  IPv6AddrType: 'SLAAC';
  Password: '********';
  IPv4Enable: true;
  PPPIdletime: 0;
  PPPDialIpMode: 'dynamic';
  Name: 'INTERNET_R_ETH4';
  Alias: 'INTERNET_R_ETH4';
  PPPDialIpAddr: '';
  Enable: true;
  AccessType: 'Ethernet';
  PPPTrigger: 'AlwaysOn';
};

type Account = {
  csrf_param: 'fvCA6PVfgAcr63sgMoq0ct9GEF78frjf';
  err: 0;
  ishilink: 0;
  rsan: 'af8cd0d7614f213d723c6bdf4b2f36f9d4a1797859425efbc8c7626a1a99d7b5df171e6426b9a98a5b1cf842b8516262c0fda70e16470ad8e278449255584c842073afddcbf4ca97198e986e571fc1af4877fc92c8da822408fbd297214d9f8bf40fbf65f9300806a421bef19afa0e56536fecc1109940f7710d8526498c2243319cb4a31e63be395eb427adaa040de36556123fd414413996b8e1cadd1d46a48118ed96bf4c903e749207881dba92048d84908c2f86a8655b4fb56da290b0e8aa516427fd8051a6f2918e50e5b226351fe815c2299cf3cbb3e4a6851df16c0b8517018148234c0582c88d416a33192b85094c77725056876c4c8e8bdc02d643';
  rsae: '010001';
  serversignature: '3853c48a4543e0402cd6b43b246ba16653841dbfae2f806f2a81a18b5674c6dc';
  rsapubkeysignature: 'f20d4f8c6ee3a22f0f790a31f73a2a832bd43d3be9178c9f8566354dd9570453';
  csrf_token: 'lpBWEbd2LtyyL8YBOG90SVe8hMHXLI1K';
  level: 2;
};
