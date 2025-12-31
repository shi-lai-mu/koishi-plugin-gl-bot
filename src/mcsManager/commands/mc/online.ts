import { formatOnlineTime } from '../../../utils';
import { MCSManagerBot } from '../../bot';
import { McUser } from '../../type';
import { BotCommandBase } from '../base';

export class MCBotGameOnline extends BotCommandBase {
  static list: Record<string, McUser> = {};

  command: string[] = ['服务器.在线 <status>', 'MC.在线 <status>'];

  roles = [];

  constructor(public readonly bot: MCSManagerBot) {
    super(bot);
    this.initialize();
  }

  async handle(): Promise<string> {
    try {
      const users = await this.bot.ctx.database.get('mcUser', {});

      const userRankings = Object.values(MCBotGameOnline.list)
        .map(user => {
          const dbUser = users.find(u => u.uuid === user.uuid);

          const totalOnlineTime = +(
            (Date.now() - (dbUser?.lastTime?.getTime() || 0)) /
            1000
          ).toFixed(0);

          return {
            ...user,
            totalOnlineTime,
          } as McUser & { totalOnlineTime: number };
        })
        .sort((a, b) => b.totalOnlineTime - a.totalOnlineTime)
        .slice(0, 10);

      let result = '==== 服务器在线玩家 ====\n';

      const tag = [, '🥇', '🥈', '🥉'];

      userRankings.forEach((user, index) => {
        const rank = index + 1;
        const medal = tag[rank] || `${rank}.`;
        const onlineTimeStr = formatOnlineTime(user.totalOnlineTime);

        result += `${medal} ${user.nickname} [HP: ${user.health.toFixed(1)} | LV: ${user.experience_level}] 「${onlineTimeStr}」\n`;
        if (index < userRankings.length - 1) {
          result += '\n';
        }
      });

      result += '====================';

      return result;
    } catch (error) {
      console.error('查询在线玩家失败:', error);
      return '查询在线玩家时发生错误，请稍后重试';
    }
  }
}

/**
 * 服务器在线榜单指令
 * 查询服务器在线时长排行
 *
 * @example 服务器 在线榜单
 */
export class MCBotOnlineTimeCommand extends BotCommandBase {
  command: string[] = ['服务器.在线榜单 <status>', 'MC.在线榜单 <status>'];

  roles = [];

  constructor(public readonly bot: MCSManagerBot) {
    super(bot);
    this.initialize();
  }

  async handle(): Promise<string> {
    try {
      const users = await this.bot.ctx.database.get('mcUser', {});

      if (users.length === 0) {
        return '暂无玩家在线时长数据';
      }

      const userRankings = users
        .map(user => {
          let totalOnlineTime = 0;

          const onlineTimeData = JSON.parse(user.onlineTimeJSON || '{}');
          if (onlineTimeData?.mc?.[user.uuid]) {
            totalOnlineTime = onlineTimeData.mc[user.uuid];
          }

          if (MCBotGameOnline.list[user.uuid]) {
            totalOnlineTime += +(
              (Date.now() - user.lastTime.getTime()) /
              1000
            ).toFixed(0);
          }

          return {
            nickname: user.nickname,
            uuid: user.uuid,
            level: user.level,
            totalOnlineTime,
            lastTime: user.lastTime,
          };
        })
        .sort((a, b) => b.totalOnlineTime - a.totalOnlineTime)
        .slice(0, 10);

      let result = '==== 服务器在线时长排行榜 ====\n';

      const tag = [, '🥇', '🥈', '🥉'];
      userRankings.forEach((user, index) => {
        const rank = index + 1;
        const medal = tag[rank] || `${rank}.`;
        const onlineTimeStr = formatOnlineTime(user.totalOnlineTime);

        result += `${medal} ${user.nickname} 「${onlineTimeStr}」\n`;
        if (index < userRankings.length - 1) {
          result += '\n';
        }
      });

      result += '========================';

      return result;
    } catch (error) {
      console.error('查询在线时长排行榜失败:', error);
      return '查询在线时长排行榜时发生错误，请稍后重试';
    }
  }
}
