import { GameStateMachine } from '@/core/GameStateMachine';
import { GameMode } from '@/types/game';

export class DuelWinnerScreen {
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
    this.element.id = 'duel-winner';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="screen__content">
        <div class="screen__title">🏆</div>
        <h2 class="screen__heading" id="dw-text">Игрок 1 побеждает!</h2>
        <div class="duel-final-score" id="dw-score">2 : 0</div>
        <div class="screen__actions">
          <button class="btn btn--primary" id="dw-retry">🔄 Ещё раз</button>
          <button class="btn btn--secondary" id="dw-menu">🏠 Меню</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#dw-retry')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.DuelSetup);
    });

    this.element.querySelector('#dw-menu')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.Menu);
    });
  }

  show(winner: 1 | 2, score: { p1: number; p2: number }): void {
    this.element.querySelector('#dw-text')!.textContent = `Игрок ${winner} побеждает!`;
    this.element.querySelector('#dw-score')!.textContent = `${score.p1} : ${score.p2}`;
    this.element.style.display = 'flex';
  }

  hide(): void { this.element.style.display = 'none'; }
}
