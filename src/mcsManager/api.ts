import { HTTP } from 'koishi';

export class MCSManagerAPI {
  userInfo: UserInfo;

  get requestHeaders() {
    return {
      cookie: this.authCookie,
      'x-requested-with': 'XMLHttpRequest',
    };
  }

  constructor(
    private http: HTTP,
    private baseUrl: string,
    private authCookie?: string,
  ) {}

  async login(username: string, password: string) {
    const result = await this.http(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      data: {
        username,
        password,
      },
    });

    if (result.status === 200 && result.headers.get('set-cookie')) {
      const cookieString = result.headers.get('set-cookie');
      this.authCookie = extractCookiesWithRegex(cookieString);
      return true;
    }
    return false;
  }

  async getUserInfo() {
    const result = await this.http<MCManagerPanelResponse<UserInfo>>(
      `${this.baseUrl}/auth/`,
      {
        headers: this.requestHeaders,
      },
    );

    if (result.status === 200) {
      this.userInfo = result.data.data;
      return this.userInfo;
    }

    return null;
  }
}

function extractCookiesWithRegex(cookieStr) {
  return cookieStr
    .match(/(\S+=\S+;)/g)
    .filter(v => v !== 'path=/;')
    .join(' ');
}
