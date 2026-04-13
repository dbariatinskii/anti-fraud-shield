import { EventBus } from '@/core/EventBus';
import { GameStateMachine } from '@/core/GameStateMachine';
import { GameMode } from '@/types/game';

export class PauseOverlay {
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
    this.element.id = 'pause-overlay';
    this.element.className = 'pause-overlay';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="pause-overlay__content">
        <div class="pause-overlay__icon">⏸</div>
        <div class="pause-overlay__buttons">
          <button class="btn btn--primary" id="pause-resume">▶️ Продолжить</button>
          <button class="btn btn--secondary" id="pause-menu">🏠 Выйти в меню</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#pause-resume')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.Game);
    });
    this.element.querySelector('#pause-menu')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.Menu);
    });
  }

  show(): void { this.element.style.display = 'flex'; }
  hide(): void { this.element.style.display = 'none'; }
}
