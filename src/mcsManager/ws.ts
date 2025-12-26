import * as io from 'socket.io-client';

import { Context, Logger } from 'koishi';
import { GLBotConfigType } from '../gl';

const logger = new Logger('mcsmanager-ws');

export class MCSManagerWebSocketIO {
  public connect: io.Socket;

  constructor(
    private ctx: Context,
    private config: GLBotConfigType,
  ) {}

  initialize() {
    if (this.connect) {
      this.connect.close();
    }

    this.connect = io.connect(this.config.mcManagerWs, {
      multiplex: false,
      reconnectionDelayMax: 1000 * 3,
      timeout: 1000 * 3,
      reconnection: true,
      reconnectionAttempts: 2000,
    });
    this.connect.on('connect', this.onConnect.bind(this));
    this.connect.on('disconnect', this.onDisconnect.bind(this));
    this.connect.on('reconnect', this.onReconnect.bind(this));
    this.connect.on('connect_error', this.onConnectError.bind(this));
  }

  private onConnect() {
    logger.info('已连接到 MCSManager WebSocket 服务器');
    this.authenticate();
  }

  private onDisconnect(reason: string) {
    logger.warn(`与 MCSManager WebSocket 服务器的连接已断开，原因：${reason}`);
  }

  private onReconnect(attemptNumber: number) {
    logger.info(
      `正在重新连接到 MCSManager WebSocket 服务器，尝试次数：${attemptNumber}`,
    );
  }

  private onConnectError(error: Error) {
    logger.error(`连接 MCSManager WebSocket 服务器时出错：${error.message}`);
  }

  public authenticate() {}
}
