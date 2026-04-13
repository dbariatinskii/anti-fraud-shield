import { EventBus } from '@/core/EventBus';
import { CardData } from '@/types/game';
import { getIconInfo } from '@/config/icons';

/** Практика обучения: 20 карточек с подсказками при наведении */
export class TrainingOverlay {
  private element!: HTMLElement;
  private container: HTMLElement;
  private progressBar!: HTMLElement;
  private tooltip!: HTMLElement;
  private correct = 0;
  private mistakes = 0;
  private total = 0;
  private patternStats: Record<string, { correct: number; total: number }> = {};

  constructor(
    private eventBus: EventBus,
    private uiLayer: HTMLElement,
    private cardContainer: HTMLElement,
  ) {
    this.container = uiLayer;
    this.build();
  }

  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'training-overlay';
    this.element.className = 'training-overlay--active';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="training-instruction" id="training-instruction">
        <div class="training-instruction__icon">👆</div>
        <div class="training-instruction__text">Кликай по подозрительным транзакциям</div>
        <div class="training-instruction__subtext">Наведи на карточку для подсказки</div>
      </div>
      <div class="training-progress" id="training-progress"></div>
      <div class="training-tooltip" id="training-tooltip"></div>
    `;
    this.container.appendChild(this.element);

    this.progressBar = this.element.querySelector('#training-progress')!;
    this.tooltip = this.element.querySelector('#training-tooltip')!;
  }

  /** Начать практику */
  start(cards: CardData[]): void {
    this.correct = 0;
    this.mistakes = 0;
    this.total = cards.length;
    this.patternStats = {};
    this.element.style.display = 'flex';
    this.updateProgress();

    // Скрыть инструкцию через 4 секунды
    const instruction = this.element.querySelector('#training-instruction') as HTMLElement | null;
    if (instruction) {
      setTimeout(() => {
        instruction.style.opacity = '0';
        setTimeout(() => { instruction.style.display = 'none'; }, 500);
      }, 4000);
    }

    this.cardContainer.addEventListener('mouseenter', this.handleHover, true);
    this.cardContainer.addEventListener('mouseleave', this.handleHoverLeave, true);
  }

  /** Записать результат шага */
  recordStep(card: CardData, wasCorrect: boolean): void {
    if (wasCorrect) {
      this.correct++;
    } else {
      this.mistakes++;
    }

    const pattern = card.icon;
    if (!this.patternStats[pattern]) {
      this.patternStats[pattern] = { correct: 0, total: 0 };
    }
    this.patternStats[pattern].total++;
    if (wasCorrect) {
      this.patternStats[pattern].correct++;
    }

    this.updateProgress();

    this.eventBus.emit('training:step', {
      current: this.correct + this.mistakes,
      total: this.total,
      correct: wasCorrect,
    });

    // Если все карточки обработаны — завершить практику
    if (this.correct + this.mistakes >= this.total) {
      this.finish();
    }
  }

  /** Завершить практику */
  finish(): void {
    this.cardContainer.removeEventListener('mouseenter', this.handleHover, true);
    this.cardContainer.removeEventListener('mouseleave', this.handleHoverLeave, true);
    this.element.style.display = 'none';

    this.eventBus.emit('training:complete', {
      correct: this.correct,
      mistakes: this.mistakes,
      patternStats: this.patternStats,
    });
  }

  /** Скрыть без отправки события (для cleanup) */
  hide(): void {
    this.cardContainer.removeEventListener('mouseenter', this.handleHover, true);
    this.cardContainer.removeEventListener('mouseleave', this.handleHoverLeave, true);
    this.element.style.display = 'none';
  }

  private updateProgress(): void {
    const done = this.correct + this.mistakes;
    const pct = this.total > 0 ? (done / this.total) * 100 : 0;
    this.progressBar.style.width = `${pct}%`;
  }

  private handleHover = (e: Event): void => {
    const target = e.target as HTMLElement;
    const cardEl = target.closest('.card');
    if (!cardEl) return;
    const cardHtmlEl = cardEl as HTMLElement;
    if (!cardHtmlEl.dataset.cardId) return;

    const iconEl = cardHtmlEl.querySelector('.card__icon');
    if (!iconEl) return;

    const iconText = iconEl.textContent || '';
    const iconMap: Record<string, string> = {
      '🌐': 'globe', '🕐': 'clock', '⚡': 'zap', '⚠️': 'alert',
      '💳': 'card', '🛒': 'shopping', '📱': 'phone', '🏠': 'home',
    };
    const iconKey = iconMap[iconText] || 'globe';
    const info = getIconInfo(iconKey);

    this.tooltip.textContent = info.description;
    this.tooltip.style.display = 'block';

    const rect = cardHtmlEl.getBoundingClientRect();
    this.tooltip.style.left = `${rect.left}px`;
    this.tooltip.style.top = `${rect.top - 60}px`;
  };

  private handleHoverLeave = (): void => {
    this.tooltip.style.display = 'none';
  };
}
