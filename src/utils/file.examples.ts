import { Session, h } from 'koishi';

/**
 * Koishi 文件处理示例
 */

// 示例1: 直接从 session 中获取文件元素
export function getFileFromSession(session: Session) {
  // 方法1: 使用 h.select 选择文件元素
  const fileElements = h.select(session.elements, 'file');

  for (const element of fileElements) {
    const fileInfo = {
      src: element.attrs?.src,
      fileId: element.attrs?.['file-id'],
      fileName: element.attrs?.file,
      fileSize: element.attrs?.['file-size'],
    };

    console.log('检测到文件:', fileInfo);
    return fileInfo;
  }

  return null;
}

// 示例2: 通过平台API下载文件
export async function downloadFileFromSession(
  session: Session,
  fileId: string,
) {
  try {
    // 不同平台的文件下载方法可能不同

    // QQ平台示例
    if (session.platform === 'onebot') {
      // OneBot协议中可能需要调用get_group_file_url等API
      // const fileUrl = await session.bot.internal.getGroupFileUrl(session.guildId, fileId);
      // return fileUrl;
    }

    // Discord平台示例
    if (session.platform === 'discord') {
      // Discord文件通常直接有URL
      return fileId; // 在Discord中，file-id通常就是直接的URL
    }

    // 通用方法：尝试直接访问fileId作为URL
    if (fileId.startsWith('http')) {
      return fileId;
    }

    throw new Error(
      `平台 ${session.platform} 不支持文件下载或文件ID格式不正确`,
    );
  } catch (error) {
    console.error('获取文件URL失败:', error);
    throw error;
  }
}

// 示例3: 完整的文件处理流程
export async function processFileMessage(session: Session): Promise<string> {
  const fileInfo = getFileFromSession(session);

  if (!fileInfo) {
    return '未检测到文件';
  }

  try {
    const fileUrl = await downloadFileFromSession(session, fileInfo.fileId);

    // 使用 session.bot.ctx.http 下载文件
    const response = await session.bot.ctx.http.get(fileUrl, {
      responseType: 'arraybuffer',
    });

    // 这里你可以：
    // 1. 保存文件到本地
    // 2. 处理文件内容
    // 3. 上传到其他服务

    return `文件 "${fileInfo.fileName}" 下载成功，大小：${response.byteLength} 字节`;
  } catch (error) {
    return `文件下载失败：${error.message}`;
  }
}
