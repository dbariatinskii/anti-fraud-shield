/** Режимы игры */
export enum GameMode {
  Menu = 'menu',
  ClassicInit = 'classic_init',
  Game = 'game',
  Paused = 'paused',
  GameOver = 'game_over',
  Training = 'training',
  Leaderboard = 'leaderboard',
}

/** Данные карточки (логика) */
export interface CardData {
  id: string;
  type: 'risk' | 'norm';
  icon: string;
  amount: number;
  location: string;
  riskFactors: string[];
}

/** DOM-элемент карточки + состояние */
export interface CardElement {
  id: string;
  type: 'risk' | 'norm';
  element: HTMLElement;
  y: number;
  speed: number;
  active: boolean;
}

/** Событие очков */
export interface ScoreEvent {
  correct: boolean;
  points: number;
  cardType: 'risk' | 'norm';
}

/** Результат игры */
export interface GameResult {
  score: number;
  accuracy: number;
  time: number;
  shield: number;
}
