import { EventBus } from '@/core/EventBus';

/** Движок сложности с параметрической кривой */
export class DifficultyEngine {
  private readonly baseSpawnInterval = 2.0;
  private readonly minSpawnInterval = 0.8;
  private readonly baseFallSpeed = 100;
  private readonly maxFallSpeed = 150;
  private readonly totalDuration = 60;

  private currentLevel = 1;
  private lastEmitLevel = 0;

  constructor(private eventBus: EventBus) {}

  /** Рассчитать параметры сложности по elapsed времени */
  update(elapsed: number): { spawnInterval: number; fallSpeed: number } {
    const progress = Math.min(1, elapsed / this.totalDuration);

    const spawnInterval = this.baseSpawnInterval * (1 - progress * 0.6);
    const fallSpeed = this.baseFallSpeed * (1 + progress * 0.5);

    const level = Math.floor(progress * 10) + 1;
    if (level !== this.lastEmitLevel) {
      this.currentLevel = level;
      this.lastEmitLevel = level;
      this.eventBus.emit('difficulty:increased', {
        level,
        spawnInterval,
        fallSpeed,
      });
    }

    return { spawnInterval, fallSpeed };
  }

  /** Получить начальную скорость падения */
  getBaseFallSpeed(): number {
    return this.baseFallSpeed;
  }
}
