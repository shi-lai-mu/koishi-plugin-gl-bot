import { Context } from 'koishi';

export interface McUser {
  id: number;
  nickname: string;
  uuid: string;
  lastTime: Date;
  level: number;
  /// json
  onlineTimeJSON: string;
}

export default (ctx: Context) => {
  ctx.model.extend(
    'mcUser',
    {
      id: { type: 'unsigned', length: 8 },
      nickname: 'string',
      uuid: 'string',
      lastTime: 'timestamp',
      level: 'integer',
      onlineTimeJSON: 'text',
    },
    {
      primary: 'id',
      autoInc: true,
    },
  );
};
