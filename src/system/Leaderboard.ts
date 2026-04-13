import { LeaderboardEntry, LeaderboardFilter, LeaderboardSortBy } from '@/types/leaderboard';

export class Leaderboard {
  private readonly STORAGE_KEY = 'antifraud_leaderboard';
  private readonly MAX_ENTRIES = 50;

  /**
   * Сохраняет новую запись в лидерборд.
   * Генерирует уникальный ID и текущую дату автоматически.
   */
  save(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry {
    const fullEntry: LeaderboardEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
    };
    const entries = this.getAll('all');
    entries.unshift(fullEntry);
    // Ограничиваем максимальное количество записей
    if (entries.length > this.MAX_ENTRIES) entries.length = this.MAX_ENTRIES;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    return fullEntry;
  }

  /**
   * Возвращает все записи с применением фильтра и сортировки.
   */
  getAll(filter: LeaderboardFilter = 'all', sortBy: LeaderboardSortBy = 'score'): LeaderboardEntry[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    let entries: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
    const now = new Date();

    // Применяем фильтр по времени
    if (filter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      entries = entries.filter((e) => e.date >= today);
    } else if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      entries = entries.filter((e) => e.date >= weekAgo);
    }

    // Применяем сортировку
    entries.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'accuracy') return b.accuracy - a.accuracy;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return entries;
  }

  /**
   * Возвращает лучшую запись пользователя (персональный рекорд).
   */
  getPersonalBest(): LeaderboardEntry | null {
    const entries = this.getAll('all', 'score');
    return entries.length > 0 ? entries[0] : null;
  }

  /**
   * Очищает все записи лидерборда.
   */
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
