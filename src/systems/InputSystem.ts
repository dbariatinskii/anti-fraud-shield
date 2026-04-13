import { EventBus } from '@/core/EventBus';
import { CardPool } from '@/entities/CardPool';
import { DebounceLock } from '@/utils/debounce';

/** Система ввода — делегирование кликов */
export class InputSystem {
  private debounce = new DebounceLock();

  constructor(
    private eventBus: EventBus,
    private cardPool: CardPool,
    private container: HTMLElement,
  ) {}

  /** Подключить обработчики */
  init(): void {
    this.container.addEventListener('click', this.handleClick);
    this.container.addEventListener('keydown', this.handleKeydown);
  }

  /** Отключить обработчики */
  destroy(): void {
    this.container.removeEventListener('click', this.handleClick);
    this.container.removeEventListener('keydown', this.handleKeydown);
  }

  private handleClick = (e: Event): void => {
    if (this.debounce.isLocked()) return;

    const target = e.target as HTMLElement;
    const cardEl = target.closest('.card') as HTMLElement | null;
    if (!cardEl) return;

    const cardId = cardEl.dataset.cardId;
    if (!cardId) return;

    const card = this.cardPool.findById(cardId);
    if (!card) return;

    this.debounce.lock(100);
    this.eventBus.emit('card:blocked', card);
  };

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const focused = document.activeElement as HTMLElement | null;
      if (focused && focused.classList.contains('card')) {
        focused.click();
      }
    }
  };
}
