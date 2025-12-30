import { Context } from 'koishi';

import * as McSchedule from './mc.schedule';

declare module 'koishi' {
  interface Tables {
    mcUser: McSchedule.McUser;
  }
}

export const registerMcSchedule = (ctx: Context) => {
  McSchedule.default(ctx);
};
