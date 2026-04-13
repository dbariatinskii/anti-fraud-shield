/** Запись в таблице рекордов */
export interface LeaderboardEntry {
  id: string;
  score: number;
  accuracy: number;
  shield: number;
  time: number;
  date: string; // ISO date string
}

/** Фильтр по времени */
export type LeaderboardFilter = 'today' | 'week' | 'all';

/** Поле сортировки */
export type LeaderboardSortBy = 'score' | 'accuracy' | 'date';
