export enum RemoteInstanceStatusEnum {
  STOPPED = 0,
  STARTING = 1,
  STOPPING = 2,
  RUNNING = 3,
}

export const RemoteInstanceStatusName = {
  [RemoteInstanceStatusEnum.STOPPED]: '已停止',
  [RemoteInstanceStatusEnum.STARTING]: '启动中',
  [RemoteInstanceStatusEnum.STOPPING]: '停止中',
  [RemoteInstanceStatusEnum.RUNNING]: '运行中',
};
