import { h } from 'koishi';

/**
 * 清洗数据防止QQ脏数据发送到游戏内
 */
export const clearSessionContentToMcMessage = (content: string) => {
  // let imgurl = '<unknown image url>';
  if (
    content.includes('<img')
    // &&
    // h.select(content, "img")[0]?.type === "img" &&
    // h.select(content, "img")[0]?.attrs?.src
  ) {
    // imgurl = h.select(content, "img")[0].attrs.src;
    return content.replaceAll(/<img.*\/>/gi, `[图片]`);
  }

  return (
    content
      .replaceAll('&amp;', '&')
      .replaceAll(/<\/?template>/gi, '')
      .replaceAll(/<json.*\/>/gi, '<json消息>')
      .replaceAll(/<video.*\/>/gi, '<视频消息>')
      .replaceAll(/<audio.*\/>/gi, '<音频消息>')
      // .replaceAll(/<img.*\/>/gi, `[[CICode,url=${imgurl}]]`)
      .replaceAll(
        /<at.*\/>/gi,
        `@[${
          h.select(content, 'at')[0]?.attrs?.name
            ? h.select(content, 'at')[0]?.attrs?.name
            : h.select(content, 'at')[0]?.attrs?.id
        }]`,
      )
  );
};
