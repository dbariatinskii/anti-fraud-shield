import { GameMode, CardElement, ScoreEvent, GameResult } from '@/types/game';

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
}
