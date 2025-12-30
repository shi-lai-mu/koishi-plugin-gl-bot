export * from './game.mc';

/**
 * 格式化时间差为易读格式
 * @param milliseconds 时间差（毫秒）
 * @returns 格式化后的时间字符串
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds <= 0) {
    return '0分钟';
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    const remainingMonths = Math.floor((days % 365) / 30);
    return remainingMonths > 0
      ? `${years}年${remainingMonths}个月`
      : `${years}年`;
  }

  if (months > 0) {
    const remainingDays = days % 30;
    return remainingDays > 0
      ? `${months}个月${remainingDays}天`
      : `${months}月`;
  }

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}小时${remainingMinutes}分钟`
      : `${hours}小时`;
  }

  if (minutes > 0) {
    return `${minutes}分钟`;
  }

  return `${seconds}秒`;
}
