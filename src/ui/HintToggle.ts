import { EventBus } from '@/core/EventBus';

/**
 * Переключатель подсказок (цвет карточек).
 * Когда включён — карточки цветные (как сейчас), когда выключен — серые.
 * Управляется через кнопку в HUD.
 */
export class HintToggle {
  private enabled = true; // По умолчанию подсказки включены
  private button!: HTMLElement;

  constructor(
    private eventBus: EventBus,
  ) {}

  /** Инициализировать DOM кнопку */
  init(container: HTMLElement): void {
    this.button = document.createElement('button');
    this.button.className = 'hud__hint-btn';
    this.button.setAttribute('aria-label', 'Подсказки');
    this.updateButton();

    this.button.addEventListener('click', () => {
      this.toggle();
    });

    container.appendChild(this.button);
  }

  /** Переключить состояние */
  toggle(): void {
    this.enabled = !this.enabled;
    this.updateButton();
    this.eventBus.emit('hint:toggled', { enabled: this.enabled });
  }

  /** Получить текущее состояние */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Скрыть кнопку (вне игры) */
  hide(): void {
    this.button.style.display = 'none';
  }

  /** Показать кнопку (в игре) */
  show(): void {
    this.button.style.display = 'flex';
  }

  // --- Private ---

  private updateButton(): void {
    if (this.enabled) {
      this.button.textContent = '💡';
      this.button.classList.add('active');
    } else {
      this.button.textContent = '🔒';
      this.button.classList.remove('active');
    }
  }
}
