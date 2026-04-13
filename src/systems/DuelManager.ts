import { DuelPlayerResult, DuelState } from '@/types/duel';

/**
 * Менеджер управления серией дуэли.
 * Отвечает за переключение игроков, определение победителя,
 * подсчёт побед в серии и проверку завершения серии.
 */
export class DuelManager {
  private state!: DuelState;

  constructor() {
    this.reset();
  }

  /** Инициализировать серию */
  init(bestOf: 1 | 3): void {
    this.state.bestOf = bestOf;
    this.state.currentRound = 1;
    this.state.currentPlayer = 1;
    this.state.player1Wins = 0;
    this.state.player2Wins = 0;
    this.state.roundResults = { player1: null, player2: null };
  }

  /** Переключить на следующего игрока или раунд */
  nextRound(): void {
    if (this.state.currentPlayer === 1) {
      this.state.currentPlayer = 2;
    } else {
      this.state.currentPlayer = 1;
      this.state.currentRound++;
      this.state.roundResults = { player1: null, player2: null };
    }
  }

  /** Записать результат раунда */
  recordResult(player: 1 | 2, result: DuelPlayerResult): void {
    if (player === 1) {
      this.state.roundResults.player1 = result;
    } else {
      this.state.roundResults.player2 = result;
    }
  }

  /** Определить победителя раунда: 1, 2 или 0 (ничья) */
  determineWinner(): 1 | 2 | 0 {
    const p1 = this.state.roundResults.player1;
    const p2 = this.state.roundResults.player2;
    if (!p1 || !p2) return 0;

    if (p1.score !== p2.score) {
      return p1.score > p2.score ? 1 : 2;
    }
    if (p1.missedRisks !== p2.missedRisks) {
      return p1.missedRisks < p2.missedRisks ? 1 : 2;
    }
    return 0;
  }

  /** Записать победу в серию */
  recordWin(winner: 1 | 2): void {
    if (winner === 1) this.state.player1Wins++;
    else this.state.player2Wins++;
  }

  /** Серия завершена? */
  isSeriesOver(): boolean {
    const winsNeeded = Math.ceil(this.state.bestOf / 2);
    return this.state.player1Wins >= winsNeeded || this.state.player2Wins >= winsNeeded;
  }

  /** Получить счёт серии */
  getSeriesScore(): { p1: number; p2: number } {
    return { p1: this.state.player1Wins, p2: this.state.player2Wins };
  }

  /** Получить текущее состояние */
  getState(): DuelState {
    return { ...this.state };
  }

  /** Сбросить */
  reset(): void {
    this.state = {
      bestOf: 3,
      currentRound: 1,
      currentPlayer: 1,
      player1Wins: 0,
      player2Wins: 0,
      roundResults: { player1: null, player2: null },
    };
  }
}
