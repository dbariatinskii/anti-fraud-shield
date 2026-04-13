import { EventBus } from '@/core/EventBus';
import { GameStateMachine } from '@/core/GameStateMachine';
import { CardElement, GameMode } from '@/types/game';

/** Менеджер очков и щита */
export class ScoreManager {
  private score = 0;
  private shield = 100;
  private correctActions = 0;
  private totalActions = 0;

  constructor(
    private eventBus: EventBus,
    private stateMachine: GameStateMachine,
  ) {
    this.subscribe();
  }

  /** Получить текущие значения */
  getState(): { score: number; shield: number; accuracy: number } {
    return {
      score: this.score,
      shield: this.shield,
      accuracy: this.totalActions > 0
        ? (this.correctActions / this.totalActions) * 100
        : 0,
    };
  }

  /** Сбросить состояние */
  reset(): void {
    this.score = 0;
    this.shield = 100;
    this.correctActions = 0;
    this.totalActions = 0;
  }

  // --- Private ---

  private subscribe(): void {
    this.eventBus.on('card:blocked', (card: CardElement) => {
      // Работаем только в режиме классической игры
      if (this.stateMachine.getCurrent() !== GameMode.Game) return;

      this.totalActions++;

      if (card.type === 'risk') {
        this.correctActions++;
        this.score += 10;
        this.eventBus.emit('game:score', { correct: true, points: 10, cardType: 'risk' });
      } else {
        this.shield = Math.max(0, this.shield - 15);
        this.eventBus.emit('game:score', { correct: false, points: 0, cardType: 'norm' });
      }

      this.eventBus.emit('shield:changed', { value: this.shield, delta: card.type === 'risk' ? 0 : -15 });
    });

    this.eventBus.on('card:passed', (card: CardElement) => {
      // Работаем только в режиме классической игры
      if (this.stateMachine.getCurrent() !== GameMode.Game) return;

      this.totalActions++;

      if (card.type === 'norm') {
        this.correctActions++;
        this.score += 5;
        this.eventBus.emit('game:score', { correct: true, points: 5, cardType: 'norm' });
      } else {
        this.shield = Math.max(0, this.shield - 20);
        this.eventBus.emit('game:score', { correct: false, points: 0, cardType: 'risk' });
      }

      this.eventBus.emit('shield:changed', { value: this.shield, delta: card.type === 'norm' ? 0 : -20 });
    });
  }
}
