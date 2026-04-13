import { GameMode, CardElement, ScoreEvent, GameResult } from '@/types/game';
import { LeaderboardEntry } from '@/types/leaderboard';
import { DuelPlayerResult, DuelState } from '@/types/duel';

/** Строго типизированная карта событий */
export interface GameEvents {
  // Карточки
  'card:spawned': CardElement;
  'card:blocked': CardElement;
  'card:passed': CardElement;
  'card:recycle': CardElement;

  // Игра
  'game:score': ScoreEvent;
  'game:state': GameMode;
  'game:over': GameResult;

  // Щит
  'shield:changed': { value: number; delta: number };

  // Таймер
  'timer:tick': number;
  'timer:expired': void;

  // Сложность
  'difficulty:increased': { level: number; spawnInterval: number; fallSpeed: number };

  // Пауза
  'game:paused': void;
  'game:resumed': void;

  // Дуэль
  'duel:round:complete': { player: 1 | 2; result: DuelPlayerResult };
  'duel:series:complete': DuelState;

  // Обучение
  'training:intro:complete': void;
  'training:step': { current: number; total: number; correct: boolean };
  'training:complete': { correct: number; mistakes: number; patternStats: Record<string, { correct: number; total: number }> };

  // Лидерборд
  'leaderboard:saved': LeaderboardEntry;

  // Подсказки
  'hint:toggled': { enabled: boolean };
}
