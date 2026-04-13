import { EventBus } from '@/core/EventBus';
import { CardPool } from '@/entities/CardPool';
import { CardGenerator } from '@/entities/CardGenerator';

/** Спавнер карточек */
export class CardSpawner {
  private spawnTimer = 0;
  private spawnInterval = 2.0;

  constructor(
    private eventBus: EventBus,
    private cardPool: CardPool,
    private generator: CardGenerator,
  ) {}

  /** Обновить (вызывается из GameLoop) */
  update(dt: number): void {
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawn();
    }
  }

  /** Проверить, есть ли свободные слоты в пуле */
  private hasAvailableSlot(): boolean {
    return this.cardPool.getActive().length < 20; // POOL_SIZE = 20
  }

  /** Установить интервал спавна */
  setSpawnInterval(interval: number): void {
    this.spawnInterval = interval;
  }

  /** Получить текущий интервал */
  getSpawnInterval(): number {
    return this.spawnInterval;
  }

  /** Сбросить спавнер */
  reset(): void {
    this.spawnTimer = 0;
    this.spawnInterval = 2.0;
  }

  /** Принудительный спавн */
  spawn(): void {
    // Не генерировать карточку если пул исчерпан — экономим ресурсы
    if (!this.hasAvailableSlot()) return;

    const data = this.generator.generate();
    const card = this.cardPool.acquire(data);

    if (card) {
      this.eventBus.emit('card:spawned', card);
    }
  }
}
