import { EventBus } from '@/core/EventBus';
import { GameStateMachine } from '@/core/GameStateMachine';
import { GameMode } from '@/types/game';
import { Leaderboard } from '@/systems/Leaderboard';
import { ShareService } from '@/systems/ShareService';
import { LeaderboardFilter, LeaderboardSortBy } from '@/types/leaderboard';

export class LeaderboardScreen {
  private element!: HTMLElement;
  private container: HTMLElement;
  private currentFilter: LeaderboardFilter = 'all';
  private currentSort: LeaderboardSortBy = 'score';

  constructor(
    private eventBus: EventBus,
    private stateMachine: GameStateMachine,
    private leaderboard: Leaderboard,
    uiLayer: HTMLElement,
  ) {
    this.container = uiLayer;
    this.build();
  }

  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'leaderboard-screen';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="screen__content leaderboard-content">
        <h2 class="screen__heading">📊 Таблица рекордов</h2>
        <div class="leaderboard-controls">
          <div class="leaderboard-filters" id="lb-filters">
            <button class="btn btn--sm" data-filter="today">Сегодня</button>
            <button class="btn btn--sm" data-filter="week">Неделя</button>
            <button class="btn btn--sm active" data-filter="all">Всё время</button>
          </div>
          <div class="leaderboard-sort" id="lb-sort">
            <button class="btn btn--sm active" data-sort="score">Очки</button>
            <button class="btn btn--sm" data-sort="accuracy">Точность</button>
          </div>
        </div>
        <div class="leaderboard-list" id="lb-list"></div>
        <div class="leaderboard-share" id="lb-share" style="display:none;">
          <button class="btn btn--secondary" id="lb-copy">📋 Поделиться</button>
          <span class="leaderboard-copied" id="lb-copied" style="display:none;">Скопировано!</span>
        </div>
        <div class="screen__actions">
          <button class="btn btn--secondary" id="lb-menu">🏠 Меню</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#lb-filters')?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-filter]') as HTMLElement | null;
      if (!btn) return;
      this.currentFilter = btn.dataset.filter as LeaderboardFilter;
      this.element.querySelectorAll('#lb-filters .btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.render();
    });

    this.element.querySelector('#lb-sort')?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-sort]') as HTMLElement | null;
      if (!btn) return;
      this.currentSort = btn.dataset.sort as LeaderboardSortBy;
      this.element.querySelectorAll('#lb-sort .btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.render();
    });

    this.element.querySelector('#lb-copy')?.addEventListener('click', async () => {
      const best = this.leaderboard.getPersonalBest();
      if (!best) return;
      const text = ShareService.generateText(best);
      await ShareService.copyToClipboard(text);
      const copied = this.element.querySelector('#lb-copied') as HTMLElement;
      copied.style.display = 'inline';
      setTimeout(() => { copied.style.display = 'none'; }, 2000);
    });

    this.element.querySelector('#lb-menu')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.Menu);
    });
  }

  show(): void {
    this.render();
    this.element.style.display = 'flex';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  private render(): void {
    const entries = this.leaderboard.getAll(this.currentFilter, this.currentSort);
    const best = this.leaderboard.getPersonalBest();
    const listEl = this.element.querySelector('#lb-list') as HTMLElement;
    const shareEl = this.element.querySelector('#lb-share') as HTMLElement;

    if (entries.length === 0) {
      listEl.innerHTML = '<div class="leaderboard-empty">Пока нет результатов. Сыграйте в классику!</div>';
      shareEl.style.display = 'none';
      return;
    }

    shareEl.style.display = 'block';
    const rows = entries.map((entry, i) => {
      const isBest = best && entry.id === best.id;
      const date = new Date(entry.date).toLocaleDateString('ru-RU');
      return `<div class="leaderboard-row ${isBest ? 'leaderboard-row--best' : ''}">
        <span class="leaderboard-rank">#${i + 1}</span>
        <span class="leaderboard-score">${entry.score}</span>
        <span class="leaderboard-accuracy">${Math.round(entry.accuracy)}%</span>
        <span class="leaderboard-date">${date}</span>
      </div>`;
    }).join('');

    listEl.innerHTML = `<div class="leaderboard-header"><span>#</span><span>Очки</span><span>Точность</span><span>Дата</span></div>${rows}`;
  }
}
