import { EventBus } from '@/core/EventBus';

/**
 * Переключатель подсказок (цвет карточек).
 * Управляет кнопкой внутри HUD (id="hud-hint-btn").
 * Когда включён — карточки цветные (как сейчас), когда выключен — серые.
 */
export class HintToggle {
  private enabled = true; // По умолчанию подсказки включены
  private button: HTMLElement | null = null;

  constructor(
    private eventBus: EventBus,
  ) {}

  /** Привязать к кнопке HUD */
  init(hud: { getHintButton: () => HTMLElement | null }): void {
    this.button = hud.getHintButton();
    if (!this.button) return;

    this.button.addEventListener('click', () => {
      this.toggle();
    });
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
    if (this.button) this.button.style.display = 'none';
  }

  /** Показать кнопку (в игре) */
  show(): void {
    if (this.button) this.button.style.display = 'flex';
  }

  // --- Private ---

  private updateButton(): void {
    if (!this.button) return;

    if (this.enabled) {
      this.button.textContent = '💡';
      this.button.classList.add('active');
    } else {
      this.button.textContent = '🔒';
      this.button.classList.remove('active');
    }
  }
}
