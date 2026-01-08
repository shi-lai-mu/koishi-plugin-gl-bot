import { isEmpty, isEqual, merge } from 'lodash';
import { BotCommandBase } from '../../../gl/commands/base';
import MinecraftQueQiao from '../../../queQiao';
import { formatOnlineTime } from '../../../utils';
import { MCSManagerBot } from '../../bot';
import { McUser } from '../../type';

export class MCBotGameOnline extends BotCommandBase {
  static list: Record<
    string,
    {
      config: Schemastery.TypeS<typeof MinecraftQueQiao.Config>;
      list: Record<string, McUser>;
    }
  > = {};

  command: string[] = ['服务器.在线 <status>', 'MC.在线 <status>'];

  roles = [];

  constructor(public readonly bot: MCSManagerBot) {
    super(bot);
  }

  async getOnlinePlayers(connect: MinecraftQueQiao) {
    // There are 2 of a max of 2026 players online: xxx, xxxx
    return (
      (await connect.sendRconCommand('list'))
        ?.match(/There are \d+ of a max of \d+ players online: (.*)/)?.[1]
        ?.split(',')
        ?.map(name => name.trim())
        ?.filter(name => name.length > 0) ?? []
    );
  }

  async handle(): Promise<string> {
    // 先获取在线人数
    const rconPlayersResults: Record<
      string,
      {
        config: Schemastery.TypeS<typeof MinecraftQueQiao.Config>;
        list: Record<string, Partial<McUser>>;
      }
    > = {};

    for (const [name, server] of Object.entries(
      this.bot.manager.gl.queQiaoAdapter.servers,
    )) {
      const online = await this.getOnlinePlayers(server);
      const serverConfig = server.config;

      rconPlayersResults[server.config.serverName || ''] = {
        config: serverConfig,
        list: online.reduce((acc, nickname) => {
          acc[nickname] = {
            nickname,
            uuid: '', // UUID 需要通过其他方式获取
            server: serverConfig,
          };

          return acc;
        }, {}),
      };
    }

    // 内存中的在线玩家
    try {
      const users = await this.bot.ctx.database.get('mcUser', {});
      const allOnlineUsers: McUser[] = Object.values(
        merge({}, rconPlayersResults, MCBotGameOnline.list),
      ).flatMap(server => {
        return Object.values(server.list).map(user => {
          user.server = server.config;

          return user;
        });
      });

      const userRankings = allOnlineUsers
        .map(user => {
          const dbUser = users.find(
            u => u.uuid === user.uuid || u.nickname === user.nickname,
          );

          let totalOnlineTime = +(
            (Date.now() - (dbUser?.lastTime?.getTime() || 0)) /
            1000
          ).toFixed(0);

          // rcon 未获取到 UUID 情况
          if (isEmpty(user.uuid)) {
            totalOnlineTime = -1;
          }

          return {
            ...user,
            totalOnlineTime,
          } as McUser & { totalOnlineTime: number };
        })
        .sort((a, b) => b.totalOnlineTime - a.totalOnlineTime)
        .slice(0, 10);

      let result = `==== 在线 玩家 ====\n`;

      userRankings.forEach((user, index) => {
        const rank = index + 1;
        const onlineTimeStr = isEqual(user.totalOnlineTime, -1)
          ? ''
          : `「${formatOnlineTime(user.totalOnlineTime)}」`;

        result += `[${user.server.serverName ?? '-'}] ${rank}. ${user.nickname} ${onlineTimeStr}\n`;
      });

      result += '=================';

      if (userRankings.length === 0) {
        return '当前没有在线玩家';
      }

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
