import { GameMode } from '@/types/game';
import { EventBus } from '@/core/EventBus';

/** Разрешённые переходы */
const VALID_TRANSITIONS: Record<GameMode, GameMode[]> = {
  [GameMode.Menu]: [GameMode.ClassicInit, GameMode.Training, GameMode.Leaderboard],
  [GameMode.ClassicInit]: [GameMode.Game],
  [GameMode.Game]: [GameMode.GameOver, GameMode.Paused],
  [GameMode.Paused]: [GameMode.Game, GameMode.Menu],
  [GameMode.GameOver]: [GameMode.ClassicInit, GameMode.Menu, GameMode.Leaderboard],
  [GameMode.Training]: [GameMode.GameOver, GameMode.Menu, GameMode.ClassicInit, GameMode.Training],
  [GameMode.Leaderboard]: [GameMode.Menu],
};

/** Конечный автомат состояний */
export class GameStateMachine {
  private current: GameMode = GameMode.Menu;

  constructor(private eventBus: EventBus) {}

  /** Получить текущее состояние */
  getCurrent(): GameMode {
    return this.current;
  }

  /** Проверить, находится ли игра в активном состоянии */
  isRunning(): boolean {
    return this.current === GameMode.Game;
  }

  /** Выполнить переход */
  transition(to: GameMode): void {
    const allowed = VALID_TRANSITIONS[this.current];
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`Invalid transition: ${this.current} → ${to}`);
    }
    this.current = to;
    this.eventBus.emit('game:state', to);
  }
}
