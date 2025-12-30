import { existsSync } from 'fs';
import { Argv, h } from 'koishi';
import { NapCatFileDownloader } from '../../utils';
import { MCSManagerBot } from '../bot';
import { MCBotCommandBase, MCBotCommandRole } from './base';

/**
 * 服务器创建指令
 *
 * @example 服务器 创建
 */
export class MCBotCreateCommand extends MCBotCommandBase {
  command: string[] = ['服务器.创建 <name...>', 'MC.创建 <name...>'];

  roles = [MCBotCommandRole.Admin, MCBotCommandRole.Owner];

  constructor(public readonly bot: MCSManagerBot) {
    super(bot);
    this.initialize();
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

  private async downloadAndProcessFile(
    fileInfo: any,
    session: any,
  ): Promise<string | void> {
    const { fileId, fileName } = fileInfo;

    console.log(
      `开始处理文件: ${fileName}, fileId: ${fileId}, platform: ${session.platform}`,
    );

    // 方法1: 如果fileId是URL，直接下载
    if (fileId && fileId.startsWith('http')) {
      try {
        const response = await this.bot.ctx.http.get(fileId, {
          responseType: 'arraybuffer',
          timeout: 60000, // 60秒超时
        });

        console.log(
          `直接URL下载文件成功: ${fileName}, 大小: ${response.byteLength} 字节`,
        );
        return;
      } catch (error) {
        console.warn(`直接URL下载失败: ${error.message}`);
        return `直接URL下载失败: ${error.message}`;
      }
    }

    // 方法2: NapCat/OneBot 群文件下载支持
    if (session.platform === 'onebot') {
      try {
        console.log(`使用 NapCat 工具下载群文件...`);

        const buffer = await NapCatFileDownloader.downloadGroupFile(
          session,
          fileId,
          fileName,
          this.bot.ctx,
        );

        if (buffer) {
          console.log(
            `通过 NapCat 下载文件成功: ${fileName}, 大小: ${buffer.length} 字节`,
          );

          // 可选: 保存文件到本地
          // const savePath = `./downloads/server-files/${fileName}`;
          // const fs = require('fs');
          // const path = require('path');
          // if (!fs.existsSync(path.dirname(savePath))) {
          //   fs.mkdirSync(path.dirname(savePath), { recursive: true });
          // }
          // fs.writeFileSync(savePath, buffer);

          return;
        }
      } catch (error) {
        console.warn('NapCat 下载失败:', error.message);
        // 继续尝试其他方法
      }
    }

    // 方法3: 尝试构造可能的QQ群文件URL
    if (fileId && (fileId.startsWith('/') || fileId.includes('-'))) {
      const possibleUrls = [
        `https://groupfiles.qq.com${fileId}`,
        `https://grouptalk.c2c.qq.com${fileId}`,
        `https://gchat.qpic.cn${fileId}`,
      ];

      for (const url of possibleUrls) {
        try {
          const response = await this.bot.ctx.http.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
          });

          console.log(`通过构造URL下载文件成功: ${fileName}, URL: ${url}`);
          return;
        } catch (error) {
          console.warn(`URL ${url} 下载失败:`, error.message);
          continue;
        }
      }
    }

    // 方法4: 记录文件信息但无法下载
    console.log(`文件信息记录: ${fileName}, fileId: ${fileId}`);
    console.log(`平台: ${session.platform}, 当前配置下无法自动下载此文件`);

    return '无法获取文件下载链接，请检查 NapCat 配置或手动下载';
  }
}
