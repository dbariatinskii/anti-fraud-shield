import { EventBus } from '@/core/EventBus';
import { GameMode } from '@/types/game';

export class TrainingSummary {
  private element!: HTMLElement;
  private container: HTMLElement;
  constructor(private eventBus: EventBus, uiLayer: HTMLElement) { this.container = uiLayer; this.build(); }
  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'training-summary';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `<div class="screen__content"><div class="screen__title">📊</div><h2 class="screen__heading">Результаты обучения</h2><div class="screen__stats" id="ts-stats"></div><div class="training-patterns" id="ts-patterns"></div><div class="screen__actions"><button class="btn btn--primary" id="ts-retry">🔄 Повторить</button><button class="btn btn--secondary" id="ts-classic">🏆 В классический режим</button><button class="btn btn--secondary" id="ts-menu">🏠 Меню</button></div></div>`;
    this.container.appendChild(this.element);
    this.bindEvents();
  }
  private bindEvents(): void {
    this.element.querySelector('#ts-retry')?.addEventListener('click', () => { this.hide(); this.eventBus.emit('game:state', GameMode.Training); });
    this.element.querySelector('#ts-classic')?.addEventListener('click', () => { this.hide(); this.eventBus.emit('game:state', GameMode.ClassicInit); });
    this.element.querySelector('#ts-menu')?.addEventListener('click', () => { this.hide(); this.eventBus.emit('game:state', GameMode.Menu); });
  }
  show(correct: number, mistakes: number, patternStats: Record<string, { correct: number; total: number }>): void {
    const statsEl = this.element.querySelector('#ts-stats')!;
    const patternsEl = this.element.querySelector('#ts-patterns')!;
    const total = correct + mistakes;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    statsEl.innerHTML = `<div class="stat"><span class="stat__value">${correct}</span><span class="stat__label">Правильно</span></div><div class="stat"><span class="stat__value">${mistakes}</span><span class="stat__label">Ошибки</span></div><div class="stat"><span class="stat__value">${accuracy}%</span><span class="stat__label">Точность</span></div>`;
    const rows = Object.entries(patternStats).map(([p, s]) => {
      const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
      const color = pct >= 80 ? 'var(--color-safe)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-risk)';
      return `<div class="training-pattern-row"><span>${p}</span><span style="color:${color}">${s.correct}/${s.total} (${pct}%)</span></div>`;
    }).join('');
    patternsEl.innerHTML = `<div class="training-patterns-list">${rows}</div>`;
    this.element.style.display = 'flex';
  }
  hide(): void { this.element.style.display = 'none'; }
}
