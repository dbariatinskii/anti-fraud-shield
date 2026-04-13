/** Результат одного игрока в раунде */
export interface DuelPlayerResult {
  score: number;
  accuracy: number;
  missedRisks: number;
}

/** Состояние дуэли */
export interface DuelState {
  bestOf: 1 | 3;
  currentRound: number;
  currentPlayer: 1 | 2;
  player1Wins: number;
  player2Wins: number;
  roundResults: {
    player1: DuelPlayerResult | null;
    player2: DuelPlayerResult | null;
  };
}
