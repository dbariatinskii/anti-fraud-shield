/** Простой debounce-лок для предотвращения двойных кликов */
export class DebounceLock {
  private locked = false;

  /** Проверить, залочен ли ввод */
  isLocked(): boolean {
    return this.locked;
  }

  /** Залочить на ms миллисекунд */
  lock(ms: number): void {
    if (this.locked) return;
    this.locked = true;
    setTimeout(() => {
      this.locked = false;
    }, ms);
  }
}
