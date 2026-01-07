import { existsSync } from 'fs';
import { Argv, h } from 'koishi';
import { isEqual } from 'lodash';

import { BotCommandBase, BotCommandRole } from '../../../gl/commands/base';
import { MCSManagerBot } from '../../bot';

/**
 * 服务器创建指令
 *
 * @example 服务器 创建
 */
export class MCBotCreateCommand extends BotCommandBase {
  command: string[] = ['服务器.创建 <name...>', 'MC.创建 <name...>'];

  roles = [BotCommandRole.Admin, BotCommandRole.Owner];

  constructor(public readonly bot: MCSManagerBot) {
    super(bot);
  }

  async handle({ args, session }: Argv, status?: string[]): Promise<string> {
    const { elements } = session?.event?.message?.quote ?? {};

    if (elements.length > 0) {
      const fileElements = h.select(elements, 'file');

      if (fileElements.length > 0) {
        const results = [];

        for (const [index, element] of fileElements.entries()) {
          const fileInfo = {
            src: element.attrs?.src,
            fileName: element.attrs?.file || element.attrs?.src,
            fileId: element.attrs?.['fileId'],
            fileSize: element.attrs?.['fileSize'],
          };
          results.push(`目标文件:`);

          results.push(`  名称: ${fileInfo.fileName}`);

          if (fileInfo.fileSize) {
            const sizeInMB = (
              parseInt(fileInfo.fileSize, 10) /
              1024 /
              1024
            ).toFixed(2);
            results.push(`  大小: ${sizeInMB} MB`);
          }

          await session.send(results.join('\n'));
          results.length = 0;

          // 尝试下载文件
          try {
            const result = await this.bot.manager.gl.napCat.api.getFile(
              fileInfo.fileId,
            );
            const fileExists = result ? existsSync(result?.file) : false;

            if (result && fileExists) {
              session.send('下载完毕，即将创建服务器实例并解压文件...');
              await this.bot.panel.api.instanceUploadByZip(
                this.bot.panel.remotes.find(r => isEqual(r.remarks, '节点1'))
                  .uuid,
                {
                  nickname: status
                    .filter(r => !isEqual(r.at(0), '<'))
                    .join(' '),
                  createDatetime: Date.now(),
                },
                {
                  filename: fileInfo.fileName,
                  size: fileInfo.fileSize,
                  path: result.file,
                },
                msg => {
                  session.send(msg);
                },
              );

              return '服务器已创建';
            } else {
              results.push(`状态: 处理失败`);
            }
          } catch (error) {
            results.push(`  状态: 处理失败 ${error}`);
          }
        }

        return results.join('\n');
      }
    }

    return `需要引用包含服务端压缩包的文件喵~`;
  }
}
