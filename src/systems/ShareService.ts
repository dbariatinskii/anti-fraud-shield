import { LeaderboardEntry } from '@/types/leaderboard';

export class ShareService {
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

  static async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
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
