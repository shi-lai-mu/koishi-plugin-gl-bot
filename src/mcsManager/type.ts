interface MCManagerPanelResponse<T> {
  status: number;
  data: T;
  time: number;
}

interface UserInfo {
  uuid: string;
  userName: string;
  loginTime: string;
  registerTime: string;
  instances: [];
  permission: number;
  apiKey: string;
  isInit: boolean;
  open2FA: boolean;
  secret: string;
  token: string;
}
