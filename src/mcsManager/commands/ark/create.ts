import { existsSync } from 'fs';
import { Argv, h } from 'koishi';
import { BotCommandBase, BotCommandRole } from '../../../gl/commands/base';
import { MCSManagerBot } from '../../bot';

/**
 * 服务器创建指令
 *
 * @example 服务器 创建
 */
export class ARKBotCreateCommand extends BotCommandBase {
  command: string[] = ['方舟.创建 <name...>', 'ARK.创建 <name...>'];

  roles = [BotCommandRole.All];

  constructor(public readonly bot: MCSManagerBot) {
    super(bot);
  }

  async handle(
    { args, session, ...opt }: Argv,
    status?: string[],
  ): Promise<string> {
    const { elements } = session?.event?.message?.quote ?? {};

    if (elements.length > 0) {
      const fileElements = h.select(elements, 'file');

      if (fileElements.length > 0) {
        const results = [`检测到 ${fileElements.length} 个文件:`];

        for (const [index, element] of fileElements.entries()) {
          const fileInfo = {
            src: element.attrs?.src,
            fileName: element.attrs?.file || element.attrs?.src,
            fileId: element.attrs?.['fileId'],
            fileSize: element.attrs?.['fileSize'],
          };

          results.push(`\n文件 ${index + 1}:`);
          results.push(`  名称: ${fileInfo.fileName}`);
          results.push(`  文件ID: ${fileInfo.fileId}`);

          if (fileInfo.fileSize) {
            const sizeInMB = (
              parseInt(fileInfo.fileSize, 10) /
              1024 /
              1024
            ).toFixed(2);
            results.push(`  大小: ${sizeInMB} MB`);
          }

          results.push(`-> 开始尝试下载群文件...`);
          session.send(results.join('\n'));
          results.length = 0;

          // 尝试下载文件
          try {
            const result = await this.bot.manager.gl.napCat.api.getFile(
              fileInfo.fileId,
            );
            const fileExists = result ? existsSync(result?.file) : false;

            if (result && fileExists) {
              session.send('下载完毕，正在解压并创建服务器实例...');
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
