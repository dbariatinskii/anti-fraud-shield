import { GameStateMachine } from '@/core/GameStateMachine';
import { GameMode } from '@/types/game';
import { DuelPlayerResult } from '@/types/duel';

export class DuelCompareScreen {
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
    this.element.id = 'duel-compare';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="screen__content duel-compare-content">
        <h2 class="screen__heading">Результаты раунда</h2>
        <div class="duel-compare-grid" id="dc-grid"></div>
        <div class="screen__actions">
          <button class="btn btn--primary" id="dc-next">Далее</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#dc-next')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.DuelRoundStart);
    });
  }

  show(p1: DuelPlayerResult, p2: DuelPlayerResult): void {
    const grid = this.element.querySelector('#dc-grid')!;
    const rows = [
      { label: 'Очки', v1: p1.score, v2: p2.score },
      { label: 'Точность', v1: `${Math.round(p1.accuracy)}%`, v2: `${Math.round(p2.accuracy)}%`, raw1: p1.accuracy, raw2: p2.accuracy },
      { label: 'Пропущенные риски', v1: p1.missedRisks, v2: p2.missedRisks, lower: true },
    ];

    grid.innerHTML = `
      <div class="duel-compare-header">
        <span>Игрок 1</span>
        <span>Игрок 2</span>
      </div>
      ${rows.map(r => {
        const raw1 = r.raw1 ?? 0;
        const raw2 = r.raw2 ?? 0;
        const w1 = r.lower ? (raw1 < raw2) : (raw1 > raw2);
        const w2 = r.lower ? (raw2 < raw1) : (raw2 > raw1);
        return `<div class="duel-compare-row">
          <span class="${w1 ? 'duel-compare-winner' : ''}">${r.v1}</span>
          <span class="duel-compare-label">${r.label}</span>
          <span class="${w2 ? 'duel-compare-winner' : ''}">${r.v2}</span>
        </div>`;
      }).join('')}
    `;

    this.element.style.display = 'flex';
  }

  hide(): void { this.element.style.display = 'none'; }
}
