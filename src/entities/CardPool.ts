import { CardElement, CardData } from '@/types/game';
import { rng } from '@/utils/random';
import { getIconInfo } from '@/config/icons';

/** Фиксированный пул DOM-элементов карточек */
export class CardPool {
  private pool: CardElement[] = [];
  private container!: HTMLElement;
  private readonly POOL_SIZE = 40;
  private hintsEnabled = true; // Состояние подсказок

  /** Установить состояние подсказок */
  setHintsEnabled(enabled: boolean): void {
    this.hintsEnabled = enabled;
  }

  /** Инициализировать пул DOM-элементами */
  init(container: HTMLElement): void {
    this.container = container;

    for (let i = 0; i < this.POOL_SIZE; i++) {
      const element = this.createCardElement();
      container.appendChild(element);
      this.pool.push({
        id: '',
        type: 'norm',
        element,
        y: 0,
        speed: 0,
        active: false,
        processed: false,
      });
    }
  }

  /** Взять свободный элемент из пула */
  acquire(data: CardData): CardElement | null {
    const card = this.pool.find((c) => !c.active);
    if (!card) return null;

    card.id = data.id;
    card.type = data.type;
    card.active = true;
    card.processed = false;
    card.y = -80;
    card.speed = 100;

    // Применяем цвет в зависимости от текущего состояния подсказок
    const colorClass = this.hintsEnabled
      ? `card--${data.type}`
      : 'card--neutral';
    card.element.className = `card ${colorClass} card--falling`;
    card.element.dataset.cardId = data.id;
    card.element.style.display = 'flex';
    card.element.style.transform = `translateY(${card.y}px)`;
    card.element.style.left = `${rng.range(10, 70)}%`;

    card.element.innerHTML = `
      <span class="card__icon">${this.getIconEmoji(data.icon)}</span>
      <span class="card__amount">${this.formatAmount(data.amount)}</span>
      <span class="card__location">${data.location}</span>
    `;

    // Доступность: описание иконки + сумма + локация
    const iconInfo = getIconInfo(data.icon);
    card.element.setAttribute('tabindex', '0');
    card.element.setAttribute('role', 'button');
    card.element.setAttribute(
      'aria-label',
      `${iconInfo.label}: ${this.formatAmount(data.amount)}, ${data.location}`
    );

    return card;
  }

  /** Вернуть элемент в пул */
  release(card: CardElement): void {
    card.active = false;
    card.processed = false;
    card.element.className = 'card';
    card.element.style.display = 'none';
    card.element.style.transform = '';
    card.element.dataset.cardId = '';
  }

  /** Получить все активные карточки */
  getActive(): CardElement[] {
    return this.pool.filter((c) => c.active);
  }

  /** Найти карточку по ID */
  findById(id: string): CardElement | undefined {
    return this.pool.find((c) => c.id === id && c.active);
  }

  /** Обновить цвет всех активных карточек */
  updateCardColors(hintsEnabled: boolean): void {
    this.hintsEnabled = hintsEnabled;

    for (const card of this.pool) {
      if (!card.active) continue;

      // Удаляем все цветовые классы
      card.element.classList.remove('card--risk', 'card--norm', 'card--neutral');

      // Применяем нужный класс
      if (hintsEnabled) {
        card.element.classList.add(card.type === 'risk' ? 'card--risk' : 'card--norm');
      } else {
        card.element.classList.add('card--neutral');
      }
    }
  }

  // --- Private ---

  private createCardElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.display = 'none';
    return el;
  }

  private getIconEmoji(icon: string): string {
    const icons: Record<string, string> = {
      globe: '🌐',
      clock: '🕐',
      zap: '⚡',
      alert: '⚠️',
      card: '💳',
      shopping: '🛒',
      phone: '📱',
      home: '🏠',
    };
    return icons[icon] || '💰';
  }

  private formatAmount(amount: number): string {
    return `${amount.toLocaleString('ru-RU')} ₽`;
  }
}
