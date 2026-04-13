import { GameStateMachine } from '@/core/GameStateMachine';
import { GameMode } from '@/types/game';

export class DuelRoundStartScreen {
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
    this.element.id = 'duel-round-start';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="screen__content">
        <div class="duel-score-badge" id="drs-score">0 : 0</div>
        <div class="screen__title" id="drs-icon">🎯</div>
        <h2 class="screen__heading" id="drs-text">Ход Игрока 1</h2>
        <p class="duel-round-info" id="drs-round">Раунд 1</p>
        <div class="screen__actions">
          <button class="btn btn--primary" id="drs-start">Начать</button>
          <button class="btn btn--secondary" id="drs-menu">🏠 Меню</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#drs-start')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.DuelGame);
    });

    this.element.querySelector('#drs-menu')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.Menu);
    });
  }

  show(player: 1 | 2, round: number, score: { p1: number; p2: number }): void {
    this.element.querySelector('#drs-score')!.textContent = `${score.p1} : ${score.p2}`;
    this.element.querySelector('#drs-text')!.textContent = `Ход Игрока ${player}`;
    this.element.querySelector('#drs-round')!.textContent = `Раунд ${round}`;
    this.element.style.display = 'flex';
  }

  hide(): void { this.element.style.display = 'none'; }
}
