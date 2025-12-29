import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { Context, h } from 'koishi';
import { dirname, join } from 'path';
import { pipeline } from 'stream/promises';

/**
 * 文件下载工具
 */
export class FileDownloader {
  constructor(private ctx: Context) {}

  /**
   * 从消息内容中提取文件元素
   * @param content 消息内容
   * @returns 文件元素数组
   */
  extractFileElements(content: string): {
    src: string;
    fileId: string;
    fileSize?: number;
    fileName?: string;
  }[] {
    const fileElements = h.select(content, 'file');
    return fileElements.map(element => ({
      src: element.attrs?.src || '',
      fileId: element.attrs?.['file-id'] || '',
      fileSize: element.attrs?.['file-size']
        ? parseInt(element.attrs['file-size'])
        : undefined,
      fileName: element.attrs?.file || element.attrs?.src || '',
    }));
  }

  /**
   * 下载文件到本地
   * @param fileId 文件ID
   * @param fileName 文件名
   * @param downloadDir 下载目录
   * @param bot 机器人实例（可选，如果平台支持直接获取文件URL）
   * @returns 下载的文件路径
   */
  async downloadFile(
    fileId: string,
    fileName: string,
    downloadDir: string = './downloads',
    bot?: any,
  ): Promise<string | null> {
    try {
      // 确保下载目录存在
      if (!existsSync(downloadDir)) {
        mkdirSync(downloadDir, { recursive: true });
      }

      const filePath = join(downloadDir, fileName);

      // 方法1: 尝试通过bot获取文件URL（如果平台支持）
      if (bot && typeof bot.getFileUrl === 'function') {
        try {
          const fileUrl = await bot.getFileUrl(fileId);
          return await this.downloadFromUrl(fileUrl, filePath);
        } catch (error) {
          console.warn(
            '通过bot.getFileUrl下载失败，尝试其他方式:',
            error.message,
          );
        }
      }

      // 方法2: 尝试通过HTTP直接访问文件ID
      if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
        return await this.downloadFromUrl(fileId, filePath);
      }

      // 方法3: 构造可能的文件URL（需要根据具体平台调整）
      const possibleUrls = this.constructPossibleFileUrls(fileId);

      for (const url of possibleUrls) {
        try {
          const result = await this.downloadFromUrl(url, filePath);
          if (result) {
            return result;
          }
        } catch (error) {
          continue; // 尝试下一个URL
        }
      }

      throw new Error('无法下载文件：所有下载方式都失败了');
    } catch (error) {
      console.error('文件下载失败:', error);
      return null;
    }
  }

  /**
   * 从URL下载文件
   * @param url 文件URL
   * @param filePath 保存路径
   * @returns 文件路径或null
   */
  private async downloadFromUrl(
    url: string,
    filePath: string,
  ): Promise<string | null> {
    try {
      const response = await this.ctx.http.get(url, {
        responseType: 'stream',
        timeout: 60000, // 60秒超时
      });

      // 确保目录存在
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const writeStream = createWriteStream(filePath);
      await pipeline(response, writeStream);

      console.log(`文件下载成功: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`从 ${url} 下载文件失败:`, error);
      throw error;
    }
  }

  /**
   * 根据文件ID构造可能的文件URL
   * @param fileId 文件ID
   * @returns 可能的URL数组
   */
  private constructPossibleFileUrls(fileId: string): string[] {
    const urls: string[] = [];

    // 如果fileId就是完整URL
    if (fileId.startsWith('http')) {
      urls.push(fileId);
    }

    // QQ群文件的常见URL格式（需要根据实际情况调整）
    if (fileId.startsWith('/')) {
      // 可能的QQ文件服务器地址
      urls.push(`https://groupfiles.qq.com${fileId}`);
      urls.push(`https://grouptalk.c2c.qq.com${fileId}`);
    }

    // 其他平台的文件URL格式可以在这里添加

    return urls;
  }

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化的文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
