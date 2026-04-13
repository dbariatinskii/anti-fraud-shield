import { GameStateMachine } from '@/core/GameStateMachine';
import { GameMode } from '@/types/game';

export class DuelSetupScreen {
  private element!: HTMLElement;
  private container: HTMLElement;

  constructor(
    private stateMachine: GameStateMachine,
    uiLayer: HTMLElement,
  ) {
    this.container = uiLayer;
    this.build();
  }

  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'duel-setup';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="screen__content">
        <div class="screen__title">⚔️</div>
        <h2 class="screen__heading">Дуэль</h2>
        <p class="duel-subtitle">Два игрока, один экран</p>
        <div class="screen__actions">
          <button class="btn btn--primary" id="duel-1round">1 раунд</button>
          <button class="btn btn--secondary" id="duel-bestof3">Best of 3</button>
          <button class="btn btn--secondary" id="duel-menu">🏠 Меню</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#duel-1round')?.addEventListener('click', () => {
      this.hide();
      (window as any).__duelBestOf = 1;
      this.stateMachine.transition(GameMode.DuelRoundStart);
    });

    this.element.querySelector('#duel-bestof3')?.addEventListener('click', () => {
      this.hide();
      (window as any).__duelBestOf = 3;
      this.stateMachine.transition(GameMode.DuelRoundStart);
    });

    this.element.querySelector('#duel-menu')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.Menu);
    });
  }

  show(): void { this.element.style.display = 'flex'; }
  hide(): void { this.element.style.display = 'none'; }
}
