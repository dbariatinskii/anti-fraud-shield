import { EventBus } from '@/core/EventBus';

/** Таймер с независимым жизненным циклом */
export class Timer {
  private remaining = 0;
  private total = 0;
  private running = false;
  private elapsed = 0;

  constructor(private eventBus: EventBus) {}

  /** Запустить таймер на N секунд */
  start(duration: number): void {
    this.total = duration;
    this.remaining = duration;
    this.elapsed = 0;
    this.running = true;
  }

  /** Поставить на паузу */
  pause(): void {
    this.running = false;
  }

  /** Возобновить */
  resume(): void {
    this.running = true;
  }

  /** Сбросить */
  reset(): void {
    this.running = false;
    this.remaining = 0;
    this.elapsed = 0;
  }

  /** Обновить (вызывается из GameLoop) */
  update(dt: number): void {
    if (!this.running) return;

    this.elapsed += dt;
    this.remaining = Math.max(0, this.total - this.elapsed);

    // Emit каждую секунду
    const newSecond = Math.ceil(this.remaining);
    const prevSecond = Math.ceil(this.remaining + dt);
    if (newSecond !== prevSecond) {
      this.eventBus.emit('timer:tick', newSecond);
    }

    // Истечение
    if (this.remaining <= 0) {
      this.running = false;
      this.eventBus.emit('timer:expired', undefined as void);
    }
  }

  /** Получить оставшееся время */
  getRemaining(): number {
    return this.remaining;
  }

  /** Получить прогресс (0..1) */
  getProgress(): number {
    return this.total > 0 ? this.elapsed / this.total : 0;
  }

  /** Получить общее время */
  getTotal(): number {
    return this.total;
  }
}
