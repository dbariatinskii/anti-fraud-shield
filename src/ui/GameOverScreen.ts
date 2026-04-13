import { EventBus } from '@/core/EventBus';
import { GameStateMachine } from '@/core/GameStateMachine';
import { GameMode, GameResult } from '@/types/game';

/** Экран завершения игры */
export class GameOverScreen {
  private element!: HTMLElement;
  private container: HTMLElement;

  constructor(
    private eventBus: EventBus,
    private stateMachine: GameStateMachine,
    uiLayer: HTMLElement,
  ) {
    this.container = uiLayer;
    this.build();
  }

  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'gameover-screen';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="screen__content">
        <div class="screen__title">🛡️</div>
        <h2 class="screen__heading">Игра завершена</h2>
        <div class="screen__stats">
          <div class="stat">
            <span class="stat__value" id="go-score">0</span>
            <span class="stat__label">Очки</span>
          </div>
          <div class="stat">
            <span class="stat__value" id="go-accuracy">0%</span>
            <span class="stat__label">Точность</span>
          </div>
          <div class="stat">
            <span class="stat__value" id="go-shield">0</span>
            <span class="stat__label">Щит</span>
          </div>
        </div>
        <div class="screen__actions">
          <button class="btn btn--primary" id="go-retry">🔄 Ещё раз</button>
          <button class="btn btn--secondary" id="go-menu">🏠 Меню</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#go-retry')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.ClassicInit);
    });

    this.element.querySelector('#go-menu')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.Menu);
    });
  }

  /** Показать с результатами */
  show(result: GameResult): void {
    this.element.querySelector('#go-score')!.textContent = `${result.score}`;
    this.element.querySelector('#go-accuracy')!.textContent = `${Math.round(result.accuracy)}%`;
    this.element.querySelector('#go-shield')!.textContent = `${result.shield}`;
    this.element.style.display = 'flex';
  }

  /** Скрыть */
  hide(): void {
    this.element.style.display = 'none';
  }
}
