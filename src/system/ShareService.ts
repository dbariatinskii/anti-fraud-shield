import { LeaderboardEntry } from '@/types/leaderboard';

/**
 * Сервис для генерации текста результата и копирования в буфер обмена.
 */
export class ShareService {
  /**
   * Генерирует текстовое представление результата для шеринга.
   */
  static generateText(entry: LeaderboardEntry): string {
    return [
      '🛡️ Anti-Fraud Shield',
      '',
      `🏆 ${entry.score} очков`,
      `🎯 ${Math.round(entry.accuracy)}% точность`,
      `🛡️ Щит: ${entry.shield}`,
      `⏱ ${entry.time} секунд`,
    ].join('\n');
  }

  /**
   * Копирует текст в буфер обмена с фоллбэком для старых браузеров.
   */
  static async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Фоллбэк для браузеров без поддержки Clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }
}
