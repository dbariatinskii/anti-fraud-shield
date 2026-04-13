# Архитектура MVP — Дизайн-док

**Дата:** 2026-04-13
**Этап:** 1 (MVP + Обучение)
**Статус:** На согласовании

---

## 1. Обзор

Архитектура браузерной мини-игры Anti-Fraud Shield — MVP с режимами обучения и классической игры. Без внешних зависимостей, на чистом TypeScript + Vite.

### Принятые архитектурные решения

| Решение | Выбор | Обоснование |
|---------|-------|-------------|
| Рендер | Гибрид: Canvas (фон/эффекты) + DOM (карточки/UI) | Нативная доступность, CSS-анимации, простота кликов |
| Анимация карточек | JS + CSS `transform` через rAF | Контроль позиции, GPU-ускорение |
| Состояния | Явный конечный автомат | Защита от недопустимых переходов, масштабируемость |
| События | EventEmitter с типизированной мапой | Производительность + типобезопасность |
| Пул объектов | Фиксированный пул DOM-элементов (20 шт.) | Предсказуемая память, нет GC-нагрузки |
| Ввод | Клик по карточке = блокировка, бездействие = пропуск | «1 клик = 1 действие», интуитивно |
| Генерация | Декларативная конфигурация | Простота тестирования, изолированные модули |

---

## 2. Архитектура слоёв

```
┌─────────────────────────────────────────┐
│  DOM Layer (UI)                         │
│  ├── MenuScreen                         │
│  ├── HUD (щит, очки, таймер)            │
│  ├── TrainingOverlay (подсказки)        │
│  └── GameOverScreen                     │
├─────────────────────────────────────────┤
│  Game Layer (DOM + Canvas)              │
│  ├── CardPool (20 DOM elements)         │
│  ├── CardSpawner                        │
│  ├── ParticleCanvas (эффекты частиц)    │
│  └── DecisionZone (нижняя граница)      │
├─────────────────────────────────────────┤
│  Core Layer (TypeScript)                │
│  ├── GameStateMachine                   │
│  ├── EventBus (EventEmitter)            │
│  ├── GameLoop (rAF, logic tick)         │
│  ├── Timer                              │
│  ├── ScoreManager                       │
│  └── DifficultyEngine                   │
└─────────────────────────────────────────┘
```

---

## 3. Поток данных

```
CardSpawner
    ↓ создаёт карточку
    ↓ emit('card:spawned', card)
    ↓
GameLoop (каждый тик rAF)
    ↓ обновляет card.y += speed * dt
    ↓ card.element.style.transform = translateY(y)
    ↓
Пользователь кликает карточку
    ↓ emit('card:blocked', card)
    ↓
ScoreManager проверяет card.type
    ↓ Если risk: +10 очков, зелёные частицы
    ↓ Если norm: -15 щита, красная вспышка
    ↓ emit('game:score', { correct, points })
    ↓
Card возвращается в пул
```

**Пассивный сценарий (пропуск):**
```
Карточка достигает decisionZone (нижняя граница)
    ↓ emit('card:passed', card)
    ↓
ScoreManager проверяет card.type
    ↓ Если risk: -20 щита, экран краснеет
    ↓ Если norm: +5 очков, тихое исчезновение
    ↓
Card возвращается в пул
```

---

## 4. Конечный автомат состояний

### Режимы (enum `GameMode`)

```
menu → training → game → gameover → menu
menu → classic → game → gameover → menu
menu → leaderboard → menu
gameover → classic → game (рекорд)
```

### Разрешённые переходы

| Из → В | Допустимо |
|--------|-----------|
| `menu` | `training`, `classic`, `leaderboard` |
| `training` | `gameover` (завершено), `menu` |
| `classic` (инициализация) | `game` |
| `game` | `gameover`, `paused` |
| `paused` | `game`, `menu` |
| `gameover` | `classic`, `menu`, `leaderboard` |
| `leaderboard` | `menu` |

Запрещённый переход бросает `Error('Invalid transition: X → Y')`.

---

## 5. Шина событий

Типизированная мапа событий:

```typescript
interface GameEvents {
  // Карточки
  'card:spawned': Card;
  'card:blocked': Card;
  'card:passed': Card;
  'card:recycle': Card; // возврат в пул

  // Игра
  'game:score': { correct: boolean; points: number; cardType: 'risk' | 'norm' };
  'game:state': GameMode;
  'game:over': { score: number; accuracy: number; time: number };

  // Щит
  'shield:changed': { value: number; delta: number };

  // Таймер
  'timer:tick': number; // оставшиеся секунды
  'timer:expired': void;

  // Сложность
  'difficulty:increased': { level: number; spawnInterval: number; fallSpeed: number };

  // Пауза
  'game:paused': void;
  'game:resumed': void;
}
```

API: `on<T>(event: keyof GameEvents, handler: (data: GameEvents[T]) => void)`, `emit`, `off`, `once`.

---

## 6. Игровой цикл

```
function gameLoop(timestamp: number):
  dt = timestamp - lastTime
  lastTime = timestamp

  if state !== 'running':
    requestAnimationFrame(gameLoop)
    return

  // Логика (каждый тик)
  updateSpawner(dt)     // проверка: пора ли создать карточку
  updateCards(dt)       // обновление позиций всех активных карточек
  checkDecisionZone()   // карточки достигли нижней границы?
  processInputQueue()   // обработка отложенных кликов

  // Рендер Canvas (только эффекты)
  particleSystem.update(dt)
  particleSystem.render()

  requestAnimationFrame(gameLoop)
```

- `requestAnimationFrame` — стандартный браузерный цикл
- `dt` в миллисекундах, конвертируется в секунды для физики
- Пауза: флаг `isRunning`, цикл продолжает работать но не обновляет логику

---

## 7. Пул карточек

### Конфигурация

- Размер пула: **20 элементов** (максимум ~8-10 на экране одновременно при высокой сложности)
- DOM-элементы создаются один раз при инициализации
- Состояния элемента: `available`, `active`, `animating`

### Методы

```typescript
class CardPool {
  acquire(): CardElement    // Взять свободный элемент
  release(card: Card): void // Вернуть в пул после анимации
  getActive(): CardElement[] // Все активные карточки
  init(container: HTMLElement): void // Создать 20 div, добавить в контейнер
}
```

### CSS-классы карточек

| Класс | Состояние | Стиль |
|-------|-----------|-------|
| `.card` | Базовый | Позиция, размер, тень |
| `.card--falling` | Падает | `will-change: transform` |
| `.card--blocked` | Заблокирована | Анимация распада |
| `.card--passed` | Пропущена | Исчезновение вниз |
| `.card--error` | Ошибка | Красная вспышка, тряска |
| `.card--risk` | Тип: риск | Иконка + красная рамка |
| `.card--norm` | Тип: норма | Иконка + зелёная рамка |

---

## 8. Система ввода

### Принцип

- **Клик по карточке** = блокировка
- **Бездействие** = пропуск (карточка уходит за нижнюю границу)
- Делегирование событий: один обработчик на контейнере карточек
- Дебаунс: **100ms** между кликами

### Обработка

```typescript
container.addEventListener('click', (e) => {
  if (debounce.isLocked()) return;
  const cardEl = e.target.closest('.card');
  if (!cardEl || !cardEl.dataset.cardId) return;

  debounce.lock(100);
  const card = getCardById(cardEl.dataset.cardId);
  eventBus.emit('card:blocked', card);
});
```

### Клавиатура

- `Enter` / `Space` — выбор (аналог клика)
- `Escape` — пауза / назад
- `Tab` — навигация по фокусируемым элементам

---

## 9. Система очков и щита

### Щит безопасности

- Начальное значение: **100**
- Минимум: **0** → игра завершается

### Начисление

| Действие | Очки | Щит | Эффект |
|----------|------|-----|--------|
| Блокировка риска | +10 | 0 | Зелёные частицы |
| Пропуск нормы | +5 | 0 | Тихое исчезновение |
| Блокировка нормы | 0 | -15 | Красная вспышка экрана |
| Пропуск риска | 0 | -20 | Экран краснеет, двойная вибрация |

### Точность

```
accuracy = correctActions / totalActions * 100
```

---

## 10. Движок сложности

### Параметрическая кривая

```typescript
progress = elapsed / totalDuration; // 0..1

spawnInterval = baseInterval * (1 - progress * 0.6);
// От 2000ms до 800ms

fallSpeed = baseSpeed * (1 + progress * 0.5);
// От 100px/s до 150px/s
```

### Обновление

Каждые 5 секунд: если `spawnInterval` или `fallSpeed` изменились > 5%, emit `difficulty:increased`.

---

## 11. Таймер

### API

```typescript
class Timer {
  start(duration: number): void    // Запустить на N секунд
  pause(): void
  resume(): void
  reset(): void
  getRemaining(): number           // Оставшиеся секунды
  // emit('timer:tick', remaining) каждую секунду
  // emit('timer:expired') при завершении
}
```

### Визуализация

- Круговой SVG/CSS прогресс в HUD
- Последние 10 секунд: пульсация (CSS `animation: pulse 1s infinite`)
- Цвет: зелёный → жёлтый (30%) → красный (10%)

---

## 12. Canvas-эффекты (частицы)

### Использование

Только для визуальных эффектов, НЕ для карточек:

- **Зелёные частицы** — распад заблокированной карточки риска
- **Красные искры** — ошибка блокировки нормы
- **Красная вспышка** — пропуск риска (весь экран)

### Архитектура

```
<canvas id="particle-layer"> — поверх игрового поля, pointer-events: none

class ParticleSystem {
  spawn(config: ParticleConfig): void
  update(dt: number): void
  render(): void
  // Частицы: { x, y, vx, vy, life, maxLife, color, size }
}
```

---

## 13. Декларативная конфигурация транзакций

### Формат

```typescript
interface TransactionTemplate {
  icon: string;          // SVG icon name
  type: 'risk' | 'norm';
  amountRange: [number, number];
  locations: string[];
  riskFactors: string[]; // ['international', 'largeAmount', 'nightTime']
  label: string;         // Для подсказок в обучении
}

// config/transactions.ts
export const transactionTemplates: TransactionTemplate[] = [
  { icon: 'globe', type: 'risk', amountRange: [50000, 500000],
    locations: ['overseas'], riskFactors: ['international', 'largeAmount'],
    label: 'Крупный международный перевод' },
  { icon: 'card', type: 'norm', amountRange: [100, 5000],
    locations: ['local'], riskFactors: [],
    label: 'Обычная локальная покупка' },
  // ... ещё шаблоны
];
```

### Генератор

```typescript
// utils/random.ts — простой RNG-хелпер
interface RNG {
  pick<T>(arr: T[]): T;               // Случайный элемент
  range(min: number, max: number): number; // Случайное число
  chance(percent: number): boolean;   // Вероятность
}

class CardGenerator {
  constructor(private templates: TransactionTemplate[], private rng: RNG) {}

  generate(): CardData {
    const template = this.rng.pick(this.templates);
    return {
      icon: template.icon,
      type: template.type,
      amount: this.rng.range(...template.amountRange),
      location: this.rng.pick(template.locations),
      riskFactors: template.riskFactors,
    };
  }
}
```

---

## 14. Структура файлов (MVP)

```
src/
├── types/
│   ├── events.ts           # GameEvents interface
│   ├── game.ts             # Card, GameMode, ScoreEvent
│   └── config.ts           # TransactionTemplate
├── core/
│   ├── EventBus.ts         # EventEmitter с типизацией
│   ├── GameStateMachine.ts # Конечный автомат
│   ├── GameLoop.ts         # rAF цикл
│   └── Timer.ts            # Таймер с паузой
├── entities/
│   ├── CardPool.ts         # Фиксированный пул DOM
│   ├── CardSpawner.ts      # Спавн с CSS анимацией
│   └── CardGenerator.ts    # Генерация из шаблонов
├── systems/
│   ├── InputSystem.ts      # Делегирование кликов
│   ├── ScoreManager.ts     # Очки + щит
│   ├── DifficultyEngine.ts # Параметрическая кривая
│   └── ParticleCanvas.ts   # Canvas-частицы
├── ui/
│   ├── MenuScreen.ts       # Главное меню
│   ├── HUD.ts              # Щит, очки, таймер
│   ├── TrainingOverlay.ts  # Подсказки обучения
│   └── GameOverScreen.ts   # Экран завершения
├── config/
│   ├── theme.ts            # CSS Custom Properties
│   └── transactions.ts     # Шаблоны транзакций
├── utils/
│   ├── debounce.ts
│   └── random.ts
└── main.ts                 # Точка входа
```

---

## 15. CSS-архитектура

### Custom Properties

```css
:root {
  /* Цвета */
  --color-safe: #22c55e;
  --color-risk: #ef4444;
  --color-neutral: #64748b;
  --color-warning: #f59e0b;
  --color-bg: #0f172a;
  --color-surface: #1e293b;

  /* Размеры */
  --spacing-unit: 8px;
  --touch-target: 44px;
  --card-radius: 12px;

  /* Анимации */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: 0ms;
    --transition-normal: 0ms;
    --transition-slow: 0ms;
  }
}
```

### Оптимизация

- `will-change: transform` только для `.card--falling`
- `contain: layout style paint` для контейнера карточек
- `pointer-events: none` для Canvas-слоя частиц
- CSS `contain` для HUD-элементов

---

## 16. Доступность

- `tabindex="0"` на всех интерактивных элементах
- `role="button"` для карточек, `aria-label` с описанием
- Видимый `:focus-visible` outline
- `prefers-reduced-motion` отключает все анимации
- Контраст ≥ 4.5:1 (проверка в оттенках серого)
- Touch-зоны ≥ 44×44px

---

## 17. Ограничения и допущения

- **Без звуков в MVP** — только визуальная обратная связь (звук можно добавить позже)
- **Без вибрации в MVP** — мобильная вибрация опциональна
- **Лидерборд** — localStorage, без бэкенда
- **Максимум 20 карточек** в пуле — достаточно для сложности MVP
- **Длительность сессии**: 60 секунд (классика), 20 транзакций (обучение)
