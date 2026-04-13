import { GameEvents } from '@/types/events';

/** Шина событий с типизацией */
export class EventBus {
  private listeners = new Map<keyof GameEvents, Set<(data: any) => void>>();

  /** Подписаться на событие */
  on<T extends keyof GameEvents>(event: T, handler: (data: GameEvents[T]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /** Отписаться от события */
  off<T extends keyof GameEvents>(event: T, handler: (data: GameEvents[T]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  /** Одноразовая подписка */
  once<T extends keyof GameEvents>(event: T, handler: (data: GameEvents[T]) => void): void {
    const onceHandler = (data: GameEvents[T]) => {
      this.off(event, onceHandler);
      handler(data);
    };
    this.on(event, onceHandler);
  }

  /** Сгенерировать событие */
  emit<T extends keyof GameEvents>(event: T, data: GameEvents[T]): void {
    this.listeners.get(event)?.forEach((handler) => handler(data));
  }

  /** Удалить всех слушателей */
  clear(): void {
    this.listeners.clear();
  }
}
