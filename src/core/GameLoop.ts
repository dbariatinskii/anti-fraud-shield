/** Игровой цикл на requestAnimationFrame */
export class GameLoop {
  private rafId: number | null = null;
  private lastTime = 0;
  private running = false;

  constructor(
    private onUpdate: (dt: number) => void,
    private onRender?: (dt: number) => void,
  ) {}

  /** Запустить цикл */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    this.rafId = requestAnimationFrame(this.tick);
  }

  /** Остановить цикл */
  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Поставить на паузу (цикл продолжает работать, но dt = 0) */
  pause(): void {
    this.lastTime = performance.now();
  }

  private tick(timestamp: number): void {
    if (!this.running) return;

    const dt = this.lastTime > 0 ? (timestamp - this.lastTime) / 1000 : 0;
    this.lastTime = timestamp;

    this.onUpdate(dt);
    this.onRender?.(dt);

    this.rafId = requestAnimationFrame(this.tick);
  }
}
