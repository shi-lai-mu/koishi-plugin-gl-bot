import { MCSManagerBot } from '../../bot';
import { BotCommandBase } from '../base';

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

  async handle(_, status?: string[]): Promise<string> {
    try {
      // 从数据库获取所有用户数据
      const users = await this.bot.ctx.database.get('mcUser', {});

      if (users.length === 0) {
        return '暂无玩家在线时长数据';
      }

      // 计算每个用户的总在线时长并排序
      const userRankings = users
        .map(user => {
          let totalOnlineTime = 0;
          try {
            const onlineTimeData = JSON.parse(user.onlineTimeJSON || '{}');
            if (onlineTimeData.mc && onlineTimeData.mc[user.uuid]) {
              totalOnlineTime = onlineTimeData.mc[user.uuid];
            }
          } catch (error) {
            console.warn(
              `解析用户 ${user.nickname} 的在线时长数据失败:`,
              error,
            );
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

      const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
          return `${hours}小时${minutes}分钟${remainingSeconds}秒`;
        } else if (minutes > 0) {
          return `${minutes}分钟${remainingSeconds}秒`;
        } else {
          return `${remainingSeconds}秒`;
        }
      };

      let result = '==== 服务器在线时长排行榜 ====\n';

      userRankings.forEach((user, index) => {
        const rank = index + 1;
        const medal =
          rank === 1
            ? '🥇'
            : rank === 2
              ? '🥈'
              : rank === 3
                ? '🥉'
                : `${rank}.`;
        const onlineTimeStr = formatTime(user.totalOnlineTime);

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
