import { $axios } from './axios';
import { CryptoJS } from './cat_enc';

/**
 * 华为路由器配置接口
 */
export interface HuaweiRouterConfig {
  baseUrl?: string;
  username?: string;
  password?: string;
  debug?: boolean;
  tokenRefreshInterval?: number;
}

/**
 * CSRF认证信息接口
 */
interface CSRFAuth {
  csrfParam: string;
  csrfToken: string;
  csrfCookie: string;
}

/**
 * 华为路由器API客户端
 */
export class HuaweiRouterClient {
  private readonly config: Required<HuaweiRouterConfig>;
  private csrfAuth: CSRFAuth;
  private scram: any;
  private firstNonce: string;
  private refreshTokenTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: HuaweiRouterConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://192.168.3.1',
      username: config.username || 'admin',
      password: config.password || '',
      debug: config.debug || false,
      tokenRefreshInterval: config.tokenRefreshInterval || 45000,
    };

    this.csrfAuth = {
      csrfParam: '',
      csrfToken: '',
      csrfCookie: '',
    };

    this.scram = CryptoJS.SCRAM({ keySize: 8 });
    this.firstNonce = this.scram.nonce().toString();
  }

  /**
   * 发送HTTP请求
   */
  private async request<T>(
    url: string,
    data: unknown = null,
    method: 'get' | 'post' = 'get',
  ): Promise<T> {
    const requestConfig = {
      headers: {
        cookie: this.csrfAuth.csrfCookie,
        log: this.config.debug,
      },
    };

    const fullUrl = `${this.config.baseUrl}${url}`;
    let requestData = data;

    if (method === 'post' && data) {
      requestData = {
        data,
        csrf: {
          csrf_param: this.csrfAuth.csrfParam,
          csrf_token: this.csrfAuth.csrfToken,
        },
      };
    }

    try {
      const response = await $axios[method]<T & Csrf>(
        fullUrl,
        method === 'post' ? requestData : requestConfig,
        method === 'post' ? requestConfig : null,
      );

      if (this.config.debug) {
        console.log({
          url: fullUrl,
          method,
          data: requestData,
          result: response?.data,
        });
      }

      this.updateCSRFFromResponse(response);
      return response?.data as T;
    } catch (error) {
      console.error(`Request failed for ${fullUrl}:`, error);
      throw error;
    }
  }

  /**
   * 从响应中更新CSRF信息
   */
  private updateCSRFFromResponse(response: any): void {
    if (response?.data) {
      if (response.data.csrf_param) {
        this.csrfAuth.csrfParam = response.data.csrf_param;
      }
      if (response.data.csrf_token) {
        this.csrfAuth.csrfToken = response.data.csrf_token;
      }
    }

    const cookie = response?.headers?.['set-cookie']?.[0]?.split?.(' ')?.[0];
    if (cookie) {
      this.csrfAuth.csrfCookie = cookie;
    }
  }

  /**
   * 从登录页面解析CSRF信息
   */
  private async parseCSRFFromLoginPage(): Promise<void> {
    const { data: loginPage } =
      (await $axios.get(`${this.config.baseUrl}/html/index.html#/login`)) || {};

    if (typeof loginPage === 'string') {
      this.csrfAuth.csrfParam =
        loginPage.match(/\<meta name="csrf_param"\s+content="(\S+)"/)?.[1] ||
        '';

      this.csrfAuth.csrfToken =
        loginPage.match(/\<meta name="csrf_token"\s+content="(\S+)"/)?.[1] ||
        '';
    }
  }

  /**
   * 获取登录随机数
   */
  private async getUserLoginNonce(): Promise<Nonce> {
    await this.parseCSRFFromLoginPage();

    const attemptLogin = async (retryCount = 0): Promise<Nonce> => {
      const data = await this.request<Nonce>(
        '/api/system/user_login_nonce',
        {
          username: this.config.username,
          firstnonce: this.firstNonce,
        },
        'post',
      );

      if (!data || data.errcode) {
        if (retryCount < 5) {
          return attemptLogin(retryCount + 1);
        }
      }

      return data;
    };

    return attemptLogin();
  }

  /**
   * 计算SCRAM认证信息
   */
  private calculateSCRAMAuth(nonce: Nonce): string {
    const salt = CryptoJS.enc.Hex.parse(nonce?.salt);
    const iterations = nonce?.iterations;
    const finalNonce = nonce?.servernonce;
    const authMessage = `${this.firstNonce},${finalNonce},${finalNonce}`;

    const saltedPassword = this.scram
      .saltedPassword(this.config.password, salt, iterations)
      .toString();

    const clientKey = this.scram
      .clientKey(CryptoJS.enc.Hex.parse(saltedPassword))
      .toString();
    const storedKey = this.scram
      .storedKey(CryptoJS.enc.Hex.parse(clientKey))
      .toString();
    const clientSignature = this.scram
      .signature(CryptoJS.enc.Hex.parse(storedKey), authMessage)
      .toString();

    const clientSignatureParsed = CryptoJS.enc.Hex.parse(clientSignature);
    const clientKeyParsed = CryptoJS.enc.Hex.parse(clientKey);

    for (let i = 0; i < clientKeyParsed.sigBytes / 4; i++) {
      clientKeyParsed.words[i] =
        clientKeyParsed.words[i] ^ clientSignatureParsed.words[i];
    }

    return clientKeyParsed.toString();
  }

  /**
   * 启动自动刷新token的定时器
   */
  private startTokenRefresh(): void {
    if (this.refreshTokenTimer) {
      return;
    }

    // this.refreshTokenTimer = setInterval(async () => {
    //   try {
    //     await this.login();
    //   } catch (error) {
    //     console.error('Token refresh failed:', error);
    //   }
    // }, this.config.tokenRefreshInterval);
  }

  /**
   * 停止token刷新定时器
   */
  private stopTokenRefresh(): void {
    if (this.refreshTokenTimer) {
      clearInterval(this.refreshTokenTimer);
      this.refreshTokenTimer = null;
    }
  }

  /**
   * 登录并获取认证信息
   */
  public async login(): Promise<{ account: Account; active: Active }> {
    const nonce = await this.getUserLoginNonce();
    const clientProof = this.calculateSCRAMAuth(nonce);

    if (this.config.debug) {
      console.log({
        clientproof: clientProof,
        finalnonce: nonce?.servernonce,
      });
    }

    const account = await this.request<Account>(
      '/api/system/user_login_proof',
      {
        clientproof: clientProof,
        finalnonce: nonce?.servernonce,
      },
      'post',
    );

    const active = await this.request<Active>(
      '/api/ntwk/wan?type=active',
      null,
      'get',
    );

    this.isInitialized = true;
    this.startTokenRefresh();

    return { account, active };
  }

  /**
   * 获取网络连接状态
   */
  public async getNetworkStatus(): Promise<Active> {
    if (!this.isInitialized || !this.csrfAuth.csrfCookie) {
      await this.login();
    }

    return this.request<Active>('/api/ntwk/wan?type=active', null, 'get');
  }

  /**
   * 销毁客户端，清理资源
   */
  public destroy(): void {
    this.stopTokenRefresh();
    this.csrfAuth = {
      csrfParam: '',
      csrfToken: '',
      csrfCookie: '',
    };
    this.isInitialized = false;
  }
}

// 保持向后兼容的导出函数
let defaultClient: HuaweiRouterClient | null = null;

const getDefaultClient = (routerPwd?: string) => {
  if (!defaultClient) {
    defaultClient = new HuaweiRouterClient({
      password: routerPwd,
    });
  }
  return defaultClient;
};

export const getLocalNetworkActive = async (
  routerPwd?: string,
): Promise<Active> => {
  return getDefaultClient(routerPwd).getNetworkStatus();
};

export const getLocalNetwork = async () => {
  return getDefaultClient().login();
};

type Nonce = {
  servernonce: '';
  isopen: 0;
  modeselected: 1;
  err: 0;
  iterations: 100;
  salt: '';
  errcode: 0;
} & Csrf;

type Csrf = {
  csrf_param: '';
  csrf_token: '';
};

type Active = {
  ConnectionType: '';
  ConnectionStatus: '';
  IPv6ConnectionStatus: '';
  ServiceList: '';
  MTU: 1500;
  WanType: '';
  MSS: 0;
  NATType: 1;
  PPPAuthMode: '';
  DownBandwidth: 0;
  IPv4AddrType: '';
  accessAuthEnable: false;
  IPv4Addr: '';
  UpBandwidthMax: 115631;
  IPv4Mask: '';
  PPPoEACName: '';
  IPv4Gateway: '';
  IsConfigured: 1;
  IPv4DnsServers: '';
  DNSOverrideAllowed: false;
  IPv6Enable: true;
  IPv4StaticMask: '';
  AccessStatus: 'Up';
  IPv4StaticGateway: '';
  ID: '';
  IPv6Gateway: '';
  IPv4StaticDnsServers: '';
  IPv6DnsServers: '';
  IPv4StaticAddr: '';
  IPv6PrefixList: '';
  accessDevNum: 0;
  UpBandwidthHistory: '';
  DownBandwidthHistory: '';
  BandwidthTime: '';
  DownBandwidthMax: 102682;
  IsDefault: 1;
  UpBandwidth: 60;
  MACColone: '';
  PPPoEServiceName: '';
  MACColoneEnable: false;
  IPv6AddrPrefixLen: 64;
  IPv6AddrSet: '';
  X_SpeDialMode: 0;
  Username: '';
  LowerLayer: '';
  MRU: 1492;
  IPv6Addr: '';
  IPv6AddrType: '';
  Password: '';
  IPv4Enable: true;
  PPPIdletime: 0;
  PPPDialIpMode: '';
  Name: '';
  Alias: '';
  PPPDialIpAddr: '';
  Enable: true;
  AccessType: '';
  PPPTrigger: '';
};

type Account = {
  csrf_param: '';
  err: 0;
  ishilink: 0;
  rsan: '';
  rsae: '';
  serversignature: '';
  rsapubkeysignature: '';
  csrf_token: '';
  level: 2;
};
