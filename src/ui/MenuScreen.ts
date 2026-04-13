import { EventBus } from '@/core/EventBus';
import { GameStateMachine } from '@/core/GameStateMachine';
import { GameMode } from '@/types/game';

/** Главное меню */
export class MenuScreen {
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
    this.element.id = 'menu-screen';
    this.element.className = 'screen';
    this.element.innerHTML = `
      <div class="screen__content">
        <div class="screen__title">🛡️</div>
        <h1 class="screen__heading">Anti-Fraud Shield</h1>
        <div class="screen__actions">
          <button class="btn btn--primary" id="btn-classic">🏆 Классика</button>
          <button class="btn btn--secondary" id="btn-training">🔰 Обучение</button>
          <button class="btn btn--secondary" id="btn-leaderboard">📊 Рекорды</button>
          <button class="btn btn--secondary" id="btn-duel">⚔️ Дуэль</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#btn-classic')?.addEventListener('click', () => {
      this.stateMachine.transition(GameMode.ClassicInit);
    });

    this.element.querySelector('#btn-training')?.addEventListener('click', () => {
      this.stateMachine.transition(GameMode.Training);
    });

    this.element.querySelector('#btn-leaderboard')?.addEventListener('click', () => {
      this.stateMachine.transition(GameMode.Leaderboard);
    });

    this.element.querySelector('#btn-duel')?.addEventListener('click', () => {
      this.stateMachine.transition(GameMode.DuelSetup);
    });
  }

  /** Показать меню */
  show(): void {
    this.element.style.display = 'flex';
  }

  /** Скрыть меню */
  hide(): void {
    this.element.style.display = 'none';
  }
}
