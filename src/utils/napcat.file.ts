import { Session } from 'koishi';

/**
 * NapCat 群文件下载工具
 * 用于处理 NapCat OneBot 协议的群文件下载
 */
export class NapCatFileDownloader {
  /**
   * 获取群文件下载URL
   * @param session Koishi Session 对象
   * @param fileId 群文件ID
   * @returns 文件下载URL或null
   */
  static async getGroupFileUrl(
    session: Session,
    fileId: string,
  ): Promise<string | null> {
    try {
      // 检查是否为 OneBot 平台且有内部API支持
      if (session.platform !== 'onebot' || !session.bot?.internal) {
        console.warn('当前平台不是 OneBot 或缺少内部API支持');
        return null;
      }

      console.log(
        `尝试通过 NapCat API 获取群文件URL，群号: ${session.channelId}, 文件ID: ${fileId}`,
      );

      // 调用 NapCat 的 get_group_file_url API
      const response = await session.bot.internal.getGroupFileUrl(
        session.channelId, // 群号
        fileId, // 文件ID
      );

      console.log('NapCat API 响应:', JSON.stringify(response, null, 2));

      // 不同版本的 NapCat 可能返回格式不同
      const fileUrl =
        response?.url ||
        response?.data?.url ||
        response?.file_url ||
        response?.data?.file_url;

      if (fileUrl) {
        console.log(`成功获取文件URL: ${fileUrl}`);
        return fileUrl;
      } else {
        console.warn('API响应中未找到有效的文件URL');
        return null;
      }
    } catch (error) {
      console.error('获取群文件URL失败:', error);
      return null;
    }
  }

  /**
   * 获取群文件信息
   * @param session Koishi Session 对象
   * @param fileId 群文件ID
   * @returns 文件信息或null
   */
  static async getGroupFileInfo(
    session: Session,
    fileId: string,
  ): Promise<any | null> {
    try {
      if (session.platform !== 'onebot' || !session.bot?.internal) {
        return null;
      }

      // 尝试获取文件信息（如果NapCat支持）
      const response = await session.bot.internal.getGroupFileInfo?.(
        session.channelId,
        fileId,
      );

      return response?.data || response || null;
    } catch (error) {
      console.warn('获取群文件信息失败:', error);
      return null;
    }
  }

  /**
   * 下载群文件到内存
   * @param session Koishi Session 对象
   * @param fileId 群文件ID
   * @param fileName 文件名（用于日志）
   * @param ctx Koishi Context（用于HTTP请求）
   * @returns 文件Buffer或null
   */
  static async downloadGroupFile(
    session: Session,
    fileId: string,
    fileName: string,
    ctx: any,
  ): Promise<Buffer | null> {
    try {
      // 获取文件下载URL
      const fileUrl = await this.getGroupFileUrl(session, fileId);

      if (!fileUrl) {
        console.error(`无法获取文件 ${fileName} 的下载URL`);
        return null;
      }

      console.log(`开始下载文件: ${fileName}`);

      // 下载文件
      const response = await ctx.http.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 60000, // 60秒超时
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const buffer = Buffer.from(response);
      console.log(`文件下载成功: ${fileName}, 大小: ${buffer.length} 字节`);

      return buffer;
    } catch (error) {
      console.error(`下载文件 ${fileName} 失败:`, error);
      return null;
    }
  }

  /**
   * 保存群文件到本地
   * @param session Koishi Session 对象
   * @param fileId 群文件ID
   * @param fileName 文件名
   * @param savePath 保存路径
   * @param ctx Koishi Context
   * @returns 是否保存成功
   */
  static async saveGroupFile(
    session: Session,
    fileId: string,
    fileName: string,
    savePath: string,
    ctx: any,
  ): Promise<boolean> {
    try {
      const buffer = await this.downloadGroupFile(
        session,
        fileId,
        fileName,
        ctx,
      );

      if (!buffer) {
        return false;
      }

      // 确保目录存在
      const fs = require('fs');
      const path = require('path');
      const dir = path.dirname(savePath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 保存文件
      fs.writeFileSync(savePath, buffer);
      console.log(`文件保存成功: ${savePath}`);

      return true;
    } catch (error) {
      console.error(`保存文件失败:`, error);
      return false;
    }
  }
}

/**
 * NapCat OneBot 协议相关的类型定义
 */
export interface NapCatFileInfo {
  file_id: string;
  file_name: string;
  file_size: number;
  busid: number;
  upload_time: number;
  dead_time: number;
  modify_time: number;
  download_times: number;
  uploader: number;
  uploader_name: string;
}

export interface NapCatFileUrlResponse {
  url?: string;
  file_url?: string;
  data?: {
    url?: string;
    file_url?: string;
  };
}
