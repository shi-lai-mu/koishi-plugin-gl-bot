import { RemoteInstanceStatusEnum } from './constants';
import { MCSManagerInstance } from './instance';

export interface MCManagerPanelResponse<T> {
  status: number;
  data: T;
  time: number;
}

export interface UserInfo {
  uuid: string;
  userName: string;
  loginTime: string;
  registerTime: string;
  instances: [];
  permission: number;
  apiKey: string;
  isInit: boolean;
  opennumberFA: boolean;
  secret: string;
  token: string;
}

export interface ServiceRemoteItem {
  uuid: string;
  ip: string;
  port: number;
  prefix: string;
  available: boolean;
  remarks: string;
}

export interface ServiceRemoteItemCustom extends ServiceRemoteItem {
  instances: MCSManagerInstance[];
  auth?: ServiceInstanceConnectAuth;
}

export interface ServiceRemoteInstanceItem {
  instanceUuid: string;
  started: number;
  status: RemoteInstanceStatusEnum;
  config: ServiceRemoteInstanceItemConfig;
  info: ServiceRemoteInstanceInfo;
}

export interface ServiceRemoteInstanceItemConfig {
  nickname: string;
  startCommand: string;
  stopCommand: string;
  cwd: string;
  ie: string;
  oe: string;
  createDatetime: number;
  lastDatetime: number;
  type: string;
  tag: [];
  endTime: number;
  fileCode: string;
  processType: string;
  updateCommand: string;
  crlf: number;
  category: number;
  enableRcon: false;
  rconPassword: string;
  rconPort: number;
  rconIp: string;
  actionCommandList: [];
  terminalOption: {
    haveColor: false;
    pty: true;
    ptyWindowCol: number;
    ptyWindowRow: number;
  };
  eventTask: {
    autoStart: false;
    autoRestart: false;
    ignore: false;
  };
  docker: {
    containerName: string;
    image: string;
    ports: [];
    extraVolumes: [];
    memory: number;
    networkMode: string;
    networkAliases: [];
    cpusetCpus: string;
    cpuUsage: number;
    maxSpace: number;
    io: number;
    network: number;
    workingDir: string;
    env: [];
    changeWorkdir: false;
  };
  pingConfig: {
    ip: string;
    port: number;
    type: number;
  };
  extraServiceConfig: {
    openFrpTunnelId: string;
    openFrpToken: string;
    isOpenFrp: false;
  };
}

export interface ServiceRemoteInstanceInfo {
  mcPingOnline: true;
  currentPlayers: number;
  maxPlayers: number;
  version: string;
  fileLock: number;
  playersChart: [];
  openFrpStatus: false;
  latency: number;
}

export interface ServiceInstanceConnectAuth {
  password: string;
  addr: string;
  prefix: string;
}

export interface CreateInstanceData {
  nickname?: string;
  startCommand?: string;
  stopCommand?: string;
  cwd?: string;
  ie?: string;
  oe?: string;
  processType?: string;
  createDatetime?: string;
  lastDatetime?: string;
  type?: string;
  tag?: string[];
  maxSpace?: null;
  endTime?: string;
  docker?: {
    containerName?: string;
    image?: string;
    ports?: string[];
    extraVolumes?: string[];
    networkMode?: 'bridge';
    networkAliases?: string[];
    cpusetCpus?: string;
    workingDir?: '/data';
    changeWorkdir?: false;
    env?: [];
  };
}

export type TerminalOption = {
  haveColor: boolean;
  pty: boolean;
  ptyWindowCol: number;
  ptyWindowRow: number;
};

export type EventTaskConfig = {
  autoStart: boolean;
  autoRestart: boolean;
  autoRestartMaxTimes: number;
  ignore: boolean;
};

export type DockerConfig = {
  containerName: string;
  image: string;
  ports: unknown[];
  extraVolumes: unknown[];
  networkMode: string;
  networkAliases: string[];
  cpusetCpus: string;
  workingDir: string;
  env: unknown[];
  changeWorkdir: boolean;
};

export type PingConfig = {
  ip: string;
  type: number;
};

export type ExtraServiceConfig = {
  openFrpTunnelId: string;
  openFrpToken: string;
};

export type CreateInstanceConfig = {
  nickname: string;
  startCommand: string;
  stopCommand: string;
  cwd: string;
  ie: string;
  oe: string;
  createDatetime: number;
  lastDatetime: number;
  type: string;
  tag: string[];
  endTime: number;
  fileCode: string;
  processType: string;
  updateCommand: string;
  runAs: string;
  actionCommandList: unknown[];
  crlf: number;
  category: number;
  enableRcon: boolean;
  rconPassword: string;
  rconIp: string;

  terminalOption: TerminalOption;
  eventTask: EventTaskConfig;
  docker: DockerConfig;
  pingConfig: PingConfig;
  extraServiceConfig: ExtraServiceConfig;
};

export interface McUser {
  nickname: string;
  uuid: string;
  address: string;
  health: number;
  max_health: number;
  experience_level: number;
  experience_progress: number;
  total_experience: number;
  is_op: boolean;
  walk_speed: number;
  x: number;
  y: number;
  z: number;
}
