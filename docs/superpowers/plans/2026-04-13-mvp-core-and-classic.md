# Anti-Fraud Shield — Ядро и Классическая игра

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Рабочая классическая игра с карточками, щитом, очками, таймером, HUD и экраном завершения.

**Architecture:** Vite + TypeScript SPA. Гибридный рендер: DOM для карточек/UI, Canvas для частиц. Явный конечный автомат, EventBus для связи слоёв, фиксированный пул из 20 DOM-элементов.

**Tech Stack:** TypeScript (strict), Vite, Canvas API, CSS Custom Properties, нативные веб-стандарты.

---

## Карта файлов

| Файл | Ответственность |
|------|----------------|
| `package.json` | Зависимости, скрипты |
| `vite.config.ts` | Алиасы `@/` → `src/` |
| `tsconfig.json` | Строгий режим, пути |
| `index.html` | Точка входа, контейнеры |
| `src/main.ts` | Bootstrap: инициализация всех систем |
| `src/types/game.ts` | Card, GameMode, CardData, ScoreEvent |
| `src/types/events.ts` | GameEvents interface |
| `src/types/config.ts` | TransactionTemplate |
| `src/core/EventBus.ts` | EventEmitter с типизацией |
| `src/core/GameStateMachine.ts` | Конечный автомат переходов |
| `src/core/GameLoop.ts` | rAF цикл с dt, пауза |
| `src/core/Timer.ts` | Таймер с pause/resume/emit |
| `src/entities/CardPool.ts` | Фиксированный пул 20 DOM |
| `src/entities/CardSpawner.ts` | Спавн, CSS-анимация падения |
| `src/entities/CardGenerator.ts` | Генерация из шаблонов |
| `src/systems/InputSystem.ts` | Делегирование кликов, дебаунс |
| `src/systems/ScoreManager.ts` | Очки + щит + точность |
| `src/systems/DifficultyEngine.ts` | Кривая сложности |
| `src/systems/ParticleCanvas.ts` | Canvas-частицы |
| `src/ui/HUD.ts` | Щит, очки, круговой таймер |
| `src/ui/MenuScreen.ts` | Главное меню |
| `src/ui/GameOverScreen.ts` | Экран завершения |
| `src/config/theme.ts` | Цвета, размеры, CSS vars |
| `src/config/transactions.ts` | 8 шаблонов транзакций |
| `src/utils/debounce.ts` | Debounce-утилита |
| `src/utils/random.ts` | RNG-хелпер |
| `src/styles/main.css` | Глобальные стили, CSS vars |

---

### Task 1: Инициализация проекта (Vite + TypeScript)

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles/main.css`

- [ ] **Step 1: Создать package.json**

```json
{
  "name": "anti-fraud-shield",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "typescript": "~5.8.0",
    "vite": "^7.0.0"
  }
}
```

- [ ] **Step 2: Создать vite.config.ts с алиасом `@/`**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 3: Создать tsconfig.json (strict mode)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Создать index.html**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Anti-Fraud Shield</title>
  <link rel="stylesheet" href="/src/styles/main.css" />
</head>
<body>
  <div id="app">
    <!-- Контейнер для UI-экранов -->
    <div id="ui-layer"></div>
    <!-- Игровое поле -->
    <div id="game-field">
      <div id="card-container"></div>
      <canvas id="particle-layer"></canvas>
    </div>
    <!-- HUD -->
    <div id="hud-layer"></div>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Создать src/styles/main.css с CSS Custom Properties**

```css
/* ===== CSS Custom Properties ===== */
:root {
  /* Цвета */
  --color-safe: #22c55e;
  --color-risk: #ef4444;
  --color-neutral: #64748b;
  --color-warning: #f59e0b;
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-surface-light: #334155;
  --color-text: #f8fafc;
  --color-text-dim: #94a3b8;

  /* Размеры */
  --spacing-unit: 8px;
  --touch-target: 44px;
  --card-radius: 12px;
  --card-width: 120px;
  --card-height: 80px;

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

/* ===== Базовые стили ===== */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.5;
}

#app {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* ===== Слои ===== */
#ui-layer {
  position: absolute;
  inset: 0;
  z-index: 100;
  pointer-events: none;
}

#ui-layer > * {
  pointer-events: auto;
}

#game-field {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
}

#card-container {
  position: absolute;
  inset: 0;
  contain: layout style paint;
}

#particle-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 15;
}

#hud-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: var(--spacing-unit);
  background: rgba(15, 23, 42, 0.1);
  display: none; /* Скрыт вне игры */
}

#hud-layer.visible {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ===== Карточки ===== */
.card {
  position: absolute;
  width: var(--card-width);
  height: var(--card-height);
  border-radius: var(--card-radius);
  background: var(--color-surface);
  border: 2px solid var(--color-neutral);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  will-change: transform;
  touch-action: manipulation;
}

.card:focus-visible {
  outline: 3px solid var(--color-warning);
  outline-offset: 2px;
}

.card--risk {
  border-color: var(--color-risk);
}

.card--norm {
  border-color: var(--color-safe);
}

.card--falling {
  will-change: transform;
}

.card--blocked {
  animation: cardDissolve var(--transition-normal) forwards;
}

.card--error {
  animation: cardShake var(--transition-fast);
}

.card--passed {
  animation: cardFadeDown var(--transition-normal) forwards;
}

.card__icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.card__amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.card__location {
  font-size: 10px;
  color: var(--color-text-dim);
}

/* ===== Кнопки ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  padding: 12px 24px;
  border-radius: var(--card-radius);
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn:active {
  transform: translateY(0);
}

.btn--primary {
  background: var(--color-safe);
  color: #000;
}

.btn--secondary {
  background: var(--color-surface-light);
}

.btn--danger {
  background: var(--color-risk);
}

/* ===== Анимации ===== */
@keyframes cardDissolve {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(0.5); }
}

@keyframes cardShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes cardFadeDown {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(20px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes screenFlash {
  0% { opacity: 0.3; }
  100% { opacity: 0; }
}

/* ===== Зона решения ===== */
.decision-zone {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to top, rgba(239, 68, 68, 0.15), transparent);
  z-index: 5;
  pointer-events: none;
}

/* ===== Экран ошибки (красная вспышка) ===== */
.error-flash {
  position: fixed;
  inset: 0;
  background: var(--color-risk);
  z-index: 200;
  pointer-events: none;
  animation: screenFlash var(--transition-normal) forwards;
}

/* ===== Экран успеха (зелёная вспышка) ===== */
.success-flash {
  position: fixed;
  inset: 0;
  background: var(--color-safe);
  z-index: 200;
  pointer-events: none;
  animation: screenFlash var(--transition-normal) forwards;
}
```

- [ ] **Step 6: Создать src/main.ts (заглушка)**

```typescript
// Точка входа — будет заполнена в Task 14
console.log('Anti-Fraud Shield initialized');
```

- [ ] **Step 7: Установить зависимости и проверить запуск**

```bash
npm install
```

```bash
npm run dev
```

Ожидаемый результат: Vite запуска dev-сервер, страница открывается, в консоли "Anti-Fraud Shield initialized".

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: инициализация проекта Vite + TypeScript"
```

---

### Task 2: Типы и EventBus

**Files:**
- Create: `src/types/game.ts`
- Create: `src/types/events.ts`
- Create: `src/types/config.ts`
- Create: `src/core/EventBus.ts`

- [ ] **Step 1: Создать src/types/game.ts**

```typescript
/** Режимы игры */
export enum GameMode {
  Menu = 'menu',
  ClassicInit = 'classic_init',
  Game = 'game',
  Paused = 'paused',
  GameOver = 'game_over',
  Training = 'training',
  Leaderboard = 'leaderboard',
}

/** Данные карточки (логика) */
export interface CardData {
  id: string;
  type: 'risk' | 'norm';
  icon: string;
  amount: number;
  location: string;
  riskFactors: string[];
}

/** DOM-элемент карточки + состояние */
export interface CardElement {
  id: string;
  type: 'risk' | 'norm';
  element: HTMLElement;
  y: number;
  speed: number;
  active: boolean;
}

/** Событие очков */
export interface ScoreEvent {
  correct: boolean;
  points: number;
  cardType: 'risk' | 'norm';
}

/** Результат игры */
export interface GameResult {
  score: number;
  accuracy: number;
  time: number;
  shield: number;
}
```

- [ ] **Step 2: Создать src/types/events.ts**

```typescript
import { GameMode, CardElement, ScoreEvent, GameResult } from '@/types/game';

/** Строго типизированная карта событий */
export interface GameEvents {
  // Карточки
  'card:spawned': CardElement;
  'card:blocked': CardElement;
  'card:passed': CardElement;
  'card:recycle': CardElement;

  // Игра
  'game:score': ScoreEvent;
  'game:state': GameMode;
  'game:over': GameResult;

  // Щит
  'shield:changed': { value: number; delta: number };

  // Таймер
  'timer:tick': number;
  'timer:expired': void;

  // Сложность
  'difficulty:increased': { level: number; spawnInterval: number; fallSpeed: number };

  // Пауза
  'game:paused': void;
  'game:resumed': void;
}
```

- [ ] **Step 3: Создать src/types/config.ts**

```typescript
/** Шаблон транзакции */
export interface TransactionTemplate {
  /** Иконка (CSS class postfix) */
  icon: string;
  /** Тип транзакции */
  type: 'risk' | 'norm';
  /** Диапазон суммы [min, max] */
  amountRange: [number, number];
  /** Возможные локации */
  locations: string[];
  /** Факторы риска */
  riskFactors: string[];
  /** Метка для подсказок */
  label: string;
}
```

- [ ] **Step 4: Создать src/core/EventBus.ts**

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add src/types src/core/EventBus.ts
git commit -m "feat: типы и EventBus с типизированной картой событий"
```

---

### Task 3: Конечный автомат состояний

**Files:**
- Create: `src/core/GameStateMachine.ts`

- [ ] **Step 1: Создать src/core/GameStateMachine.ts**

```typescript
import { GameMode } from '@/types/game';
import { EventBus } from '@/core/EventBus';

/** Разрешённые переходы */
const VALID_TRANSITIONS: Record<GameMode, GameMode[]> = {
  [GameMode.Menu]: [GameMode.ClassicInit, GameMode.Training, GameMode.Leaderboard],
  [GameMode.ClassicInit]: [GameMode.Game],
  [GameMode.Game]: [GameMode.GameOver, GameMode.Paused],
  [GameMode.Paused]: [GameMode.Game, GameMode.Menu],
  [GameMode.GameOver]: [GameMode.ClassicInit, GameMode.Menu, GameMode.Leaderboard],
  [GameMode.Training]: [GameMode.GameOver, GameMode.Menu],
  [GameMode.Leaderboard]: [GameMode.Menu],
};

/** Конечный автомат состояний */
export class GameStateMachine {
  private current: GameMode = GameMode.Menu;

  constructor(private eventBus: EventBus) {}

  /** Получить текущее состояние */
  getCurrent(): GameMode {
    return this.current;
  }

  /** Проверить, находится ли игра в активном состоянии */
  isRunning(): boolean {
    return this.current === GameMode.Game;
  }

  /** Выполнить переход */
  transition(to: GameMode): void {
    const allowed = VALID_TRANSITIONS[this.current];
    if (!allowed || !allowed.includes(to)) {
      throw new Error(`Invalid transition: ${this.current} → ${to}`);
    }
    this.current = to;
    this.eventBus.emit('game:state', to);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/GameStateMachine.ts
git commit -m "feat: конечный автомат состояний с валидацией переходов"
```

---

### Task 4: Игровой цикл (GameLoop)

**Files:**
- Create: `src/core/GameLoop.ts`

- [ ] **Step 1: Создать src/core/GameLoop.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/core/GameLoop.ts
git commit -m "feat: игровой цикл на rAF с dt и паузой"
```

---

### Task 5: Таймер

**Files:**
- Create: `src/core/Timer.ts`

- [ ] **Step 1: Создать src/core/Timer.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/core/Timer.ts
git commit -m "feat: таймер с pause/resume и emit событий"
```

---

### Task 6: RNG и Debounce утилиты

**Files:**
- Create: `src/utils/random.ts`
- Create: `src/utils/debounce.ts`

- [ ] **Step 1: Создать src/utils/random.ts**

```typescript
/** RNG-хелпер */
export const rng = {
  /** Случайный элемент массива */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /** Случайное число в диапазоне [min, max] */
  range(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /** Вероятность (0..100) */
  chance(percent: number): boolean {
    return Math.random() * 100 < percent;
  },
};
```

- [ ] **Step 2: Создать src/utils/debounce.ts**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/random.ts src/utils/debounce.ts
git commit -m "feat: RNG и Debounce утилиты"
```

---

### Task 7: Конфигурация транзакций и генератор карточек

**Files:**
- Create: `src/config/transactions.ts`
- Create: `src/entities/CardGenerator.ts`

- [ ] **Step 1: Создать src/config/transactions.ts**

```typescript
import { TransactionTemplate } from '@/types/config';

/** Шаблоны транзакций для генерации */
export const transactionTemplates: TransactionTemplate[] = [
  // === РИСК ===
  {
    icon: 'globe',
    type: 'risk',
    amountRange: [50_000, 500_000],
    locations: ['🌍 Overseas'],
    riskFactors: ['international', 'largeAmount'],
    label: 'Крупный международный перевод',
  },
  {
    icon: 'clock',
    type: 'risk',
    amountRange: [10_000, 100_000],
    locations: ['🌙 Night'],
    riskFactors: ['nightTime', 'unusualAmount'],
    label: 'Ночная подозрительная транзакция',
  },
  {
    icon: 'zap',
    type: 'risk',
    amountRange: [1_000, 20_000],
    locations: ['🔄 Multiple'],
    riskFactors: ['rapidSuccession', 'unusualLocation'],
    label: 'Серия быстрых транзакций',
  },
  {
    icon: 'alert',
    type: 'risk',
    amountRange: [100_000, 1_000_000],
    locations: ['⚠️ Unknown'],
    riskFactors: ['largeAmount', 'newMerchant'],
    label: 'Крупная оплата новому продавцу',
  },
  // === НОРМА ===
  {
    icon: 'card',
    type: 'norm',
    amountRange: [100, 5_000],
    locations: ['🏪 Local'],
    riskFactors: [],
    label: 'Обычная локальная покупка',
  },
  {
    icon: 'shopping',
    type: 'norm',
    amountRange: [500, 15_000],
    locations: ['🛒 Store'],
    riskFactors: [],
    label: 'Покупка в магазине',
  },
  {
    icon: 'phone',
    type: 'norm',
    amountRange: [50, 3_000],
    locations: ['📱 Online'],
    riskFactors: [],
    label: 'Онлайн-подписка',
  },
  {
    icon: 'home',
    type: 'norm',
    amountRange: [1_000, 10_000],
    locations: ['🏠 Home'],
    riskFactors: [],
    label: 'Коммунальный платёж',
  },
];
```

- [ ] **Step 2: Создать src/entities/CardGenerator.ts**

```typescript
import { CardData } from '@/types/game';
import { TransactionTemplate } from '@/types/config';
import { rng } from '@/utils/random';

/** Генератор карточек из шаблонов */
export class CardGenerator {
  private idCounter = 0;

  constructor(private templates: TransactionTemplate[]) {}

  /** Сгенерировать новую карточку */
  generate(): CardData {
    const template = rng.pick(this.templates);
    const id = `card-${this.idCounter++}`;

    return {
      id,
      type: template.type,
      icon: template.icon,
      amount: rng.range(...template.amountRange),
      location: rng.pick(template.locations),
      riskFactors: template.riskFactors,
    };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/config/transactions.ts src/entities/CardGenerator.ts
git commit -m "feat: конфигурация транзакций и генератор карточек"
```

---

### Task 8: Пул карточек (CardPool)

**Files:**
- Create: `src/entities/CardPool.ts`

- [ ] **Step 1: Создать src/entities/CardPool.ts**

```typescript
import { CardElement } from '@/types/game';
import { CardData } from '@/types/game';

/** Фиксированный пул DOM-элементов карточек */
export class CardPool {
  private pool: CardElement[] = [];
  private container!: HTMLElement;
  private readonly POOL_SIZE = 20;

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
    card.y = -80; // Начальная позиция за пределами экрана
    card.speed = 100; // Базовая скорость, будет перезаписана спавнером

    // Настроить элемент
    card.element.className = `card card--${data.type} card--falling`;
    card.element.dataset.cardId = data.id;
    card.element.style.display = 'flex';
    card.element.style.transform = `translateY(${card.y}px)`;
    card.element.style.left = `${rng.range(10, 70)}%`; // Случайная горизонтальная позиция

    // Заполнить контент
    card.element.innerHTML = `
      <span class="card__icon">${this.getIconEmoji(data.icon)}</span>
      <span class="card__amount">${this.formatAmount(data.amount)}</span>
      <span class="card__location">${data.location}</span>
    `;

    // Доступность
    card.element.setAttribute('tabindex', '0');
    card.element.setAttribute('role', 'button');
    card.element.setAttribute('aria-label', `Транзакция: ${data.amount}, ${data.location}`);

    return card;
  }

  /** Вернуть элемент в пул */
  release(card: CardElement): void {
    card.active = false;
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

// Импорт для rng (нужен в CardPool для горизонтальной позиции)
import { rng } from '@/utils/random';
```

- [ ] **Step 2: Commit**

```bash
git add src/entities/CardPool.ts
git commit -m "feat: фиксированный пул из 20 DOM-элементов карточек"
```

---

### Task 9: Спавнер карточек

**Files:**
- Create: `src/entities/CardSpawner.ts`

- [ ] **Step 1: Создать src/entities/CardSpawner.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { CardPool } from '@/entities/CardPool';
import { CardGenerator } from '@/entities/CardGenerator';

/** Спавнер карточек */
export class CardSpawner {
  private spawnTimer = 0;
  private spawnInterval = 2.0; // Секунды между спавнами

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

  /** Установить интервал спавна */
  setSpawnInterval(interval: number): void {
    this.spawnInterval = interval;
  }

  /** Получить текущий интервал */
  getSpawnInterval(): number {
    return this.spawnInterval;
  }

  /** Принудительный спавн */
  spawn(): void {
    const data = this.generator.generate();
    const card = this.cardPool.acquire(data);

    if (card) {
      this.eventBus.emit('card:spawned', card);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/entities/CardSpawner.ts
git commit -m "feat: спавнер карточек с таймером"
```

---

### Task 10: Система ввода (InputSystem)

**Files:**
- Create: `src/systems/InputSystem.ts`

- [ ] **Step 1: Создать src/systems/InputSystem.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { CardPool } from '@/entities/CardPool';
import { DebounceLock } from '@/utils/debounce';

/** Система ввода — делегирование кликов */
export class InputSystem {
  private debounce = new DebounceLock();

  constructor(
    private eventBus: EventBus,
    private cardPool: CardPool,
    private container: HTMLElement,
  ) {}

  /** Подключить обработчики */
  init(): void {
    // Делегирование кликов на контейнере
    this.container.addEventListener('click', this.handleClick);

    // Клавиатура
    this.container.addEventListener('keydown', this.handleKeydown);
  }

  /** Отключить обработчики */
  destroy(): void {
    this.container.removeEventListener('click', this.handleClick);
    this.container.removeEventListener('keydown', this.handleKeydown);
  }

  private handleClick = (e: Event): void => {
    if (this.debounce.isLocked()) return;

    const target = e.target as HTMLElement;
    const cardEl = target.closest('.card');
    if (!cardEl) return;

    const cardId = cardEl.dataset.cardId;
    if (!cardId) return;

    const card = this.cardPool.findById(cardId);
    if (!card) return;

    this.debounce.lock(100);
    this.eventBus.emit('card:blocked', card);
  };

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Эмулируем клик на текущем фокусе
      const focused = document.activeElement;
      if (focused && focused.classList.contains('card')) {
        focused.click();
      }
    }
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/InputSystem.ts
git commit -m "feat: система ввода с делегированием кликов и дебаунсом"
```

---

### Task 11: Очки, щит и движок сложности

**Files:**
- Create: `src/systems/ScoreManager.ts`
- Create: `src/systems/DifficultyEngine.ts`

- [ ] **Step 1: Создать src/systems/ScoreManager.ts**

```typescript
import { EventBus } from '@/core/EventBus';

/** Менеджер очков и щита */
export class ScoreManager {
  private score = 0;
  private shield = 100;
  private correctActions = 0;
  private totalActions = 0;

  constructor(private eventBus: EventBus) {
    this.subscribe();
  }

  /** Получить текущие значения */
  getState(): { score: number; shield: number; accuracy: number } {
    return {
      score: this.score,
      shield: this.shield,
      accuracy: this.totalActions > 0
        ? (this.correctActions / this.totalActions) * 100
        : 0,
    };
  }

  /** Сбросить состояние */
  reset(): void {
    this.score = 0;
    this.shield = 100;
    this.correctActions = 0;
    this.totalActions = 0;
  }

  // --- Private ---

  private subscribe(): void {
    this.eventBus.on('card:blocked', (card) => {
      this.totalActions++;

      if (card.type === 'risk') {
        // Блокировка риска — правильно
        this.correctActions++;
        this.score += 10;
        this.eventBus.emit('game:score', { correct: true, points: 10, cardType: 'risk' });
      } else {
        // Блокировка нормы — ошибка
        this.shield = Math.max(0, this.shield - 15);
        this.eventBus.emit('game:score', { correct: false, points: 0, cardType: 'norm' });
      }

      this.eventBus.emit('shield:changed', { value: this.shield, delta: card.type === 'risk' ? 0 : -15 });
    });

    this.eventBus.on('card:passed', (card) => {
      this.totalActions++;

      if (card.type === 'norm') {
        // Пропуск нормы — правильно
        this.correctActions++;
        this.score += 5;
        this.eventBus.emit('game:score', { correct: true, points: 5, cardType: 'norm' });
      } else {
        // Пропуск риска — ошибка
        this.shield = Math.max(0, this.shield - 20);
        this.eventBus.emit('game:score', { correct: false, points: 0, cardType: 'risk' });
      }

      this.eventBus.emit('shield:changed', { value: this.shield, delta: card.type === 'norm' ? 0 : -20 });
    });
  }
}
```

- [ ] **Step 2: Создать src/systems/DifficultyEngine.ts**

```typescript
import { EventBus } from '@/core/EventBus';

/** Движок сложности с параметрической кривой */
export class DifficultyEngine {
  private readonly baseSpawnInterval = 2.0; // Начальный интервал (сек)
  private readonly minSpawnInterval = 0.8;  // Минимальный интервал
  private readonly baseFallSpeed = 100;     // Начальная скорость (px/s)
  private readonly maxFallSpeed = 150;      // Максимальная скорость
  private readonly totalDuration = 60;      // Длительность сессии (сек)

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
```

- [ ] **Step 3: Commit**

```bash
git add src/systems/ScoreManager.ts src/systems/DifficultyEngine.ts
git commit -m "feat: ScoreManager и DifficultyEngine"
```

---

### Task 12: Canvas-частицы (ParticleCanvas)

**Files:**
- Create: `src/systems/ParticleCanvas.ts`

- [ ] **Step 1: Создать src/systems/ParticleCanvas.ts**

```typescript
/** Конфигурация одной частицы */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

/** Система частиц на Canvas */
export class ParticleCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Ресайз canvas под контейнер */
  private resize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }
  }

  /** Спавн частиц в точке */
  spawn(x: number, y: number, color: string, count: number = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  /** Обновить частицы */
  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; // Гравитация
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /** Отрендерить частицы */
  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/ParticleCanvas.ts
git commit -m "feat: Canvas-система частиц"
```

---

### Task 13: UI — HUD

**Files:**
- Create: `src/ui/HUD.ts`

- [ ] **Step 1: Создать src/ui/HUD.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { Timer } from '@/core/Timer';

/** HUD: щит, очки, таймер */
export class HUD {
  private element!: HTMLElement;
  private shieldBar!: HTMLElement;
  private scoreEl!: HTMLElement;
  private timerEl!: HTMLElement;
  private timerCircle!: HTMLElement;

  constructor(
    private eventBus: EventBus,
    private timer: Timer,
    private hudContainer: HTMLElement,
  ) {}

  /** Инициализировать DOM HUD */
  init(): void {
    this.element = this.hudContainer;
    this.element.innerHTML = `
      <div class="hud__left">
        <div class="hud__shield">
          <div class="hud__shield-bar">
            <div class="hud__shield-fill" id="shield-fill"></div>
          </div>
          <span class="hud__shield-icon">🛡️</span>
        </div>
      </div>
      <div class="hud__right">
        <span class="hud__score" id="hud-score">0</span>
        <div class="hud__timer">
          <svg class="hud__timer-circle" viewBox="0 0 36 36" id="hud-timer-circle">
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
            <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-safe)" stroke-width="2"
              stroke-dasharray="100.53" stroke-dashoffset="0" stroke-linecap="round"
              transform="rotate(-90 18 18)" id="hud-timer-progress"/>
          </svg>
          <span class="hud__timer-text" id="hud-timer-text">60</span>
        </div>
      </div>
    `;

    this.shieldBar = this.element.querySelector('#shield-fill')!;
    this.scoreEl = this.element.querySelector('#hud-score')!;
    this.timerEl = this.element.querySelector('#hud-timer-text')!;
    this.timerCircle = this.element.querySelector('#hud-timer-progress')!;

    this.subscribe();
  }

  /** Показать HUD */
  show(): void {
    this.element.classList.add('visible');
  }

  /** Скрыть HUD */
  hide(): void {
    this.element.classList.remove('visible');
  }

  // --- Private ---

  private subscribe(): void {
    // Щит
    this.eventBus.on('shield:changed', ({ value }) => {
      const pct = value;
      this.shieldBar.style.width = `${pct}%`;

      // Цвет по уровню
      if (pct > 50) {
        this.shieldBar.style.background = 'var(--color-safe)';
      } else if (pct > 20) {
        this.shieldBar.style.background = 'var(--color-warning)';
      } else {
        this.shieldBar.style.background = 'var(--color-risk)';
      }
    });

    // Очки
    this.eventBus.on('game:score', ({ points }) => {
      if (points > 0) {
        const current = parseInt(this.scoreEl.textContent || '0');
        this.scoreEl.textContent = `${current + points}`;
      }
    });

    // Таймер
    this.eventBus.on('timer:tick', (remaining) => {
      this.timerEl.textContent = `${remaining}`;

      // Пульсация последних 10 секунд
      if (remaining <= 10) {
        this.timerEl.classList.add('pulse');
        this.timerCircle.style.stroke = 'var(--color-risk)';
      } else if (remaining <= 20) {
        this.timerCircle.style.stroke = 'var(--color-warning)';
      }
    });

    // Обновление прогресса таймера каждый кадр
    this.eventBus.on('timer:tick', () => this.updateTimerProgress());
  }

  private updateTimerProgress(): void {
    const progress = this.timer.getProgress();
    const circumference = 100.53;
    const offset = circumference * (1 - progress);
    this.timerCircle.style.strokeDashoffset = `${offset}`;
  }

  /** Обновлять прогресс таймера каждый кадр */
  update(): void {
    this.updateTimerProgress();
  }
}
```

Добавить HUD стили в `src/styles/main.css`:

```css
/* ===== HUD ===== */
#hud-layer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
}

#hud-layer:not(.visible) {
  display: none;
}

.hud__left,
.hud__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-unit);
}

.hud__shield {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hud__shield-bar {
  width: 120px;
  height: 8px;
  background: var(--color-surface-light);
  border-radius: 4px;
  overflow: hidden;
}

.hud__shield-fill {
  height: 100%;
  width: 100%;
  background: var(--color-safe);
  border-radius: 4px;
  transition: width var(--transition-fast), background var(--transition-fast);
}

.hud__shield-icon {
  font-size: 20px;
}

.hud__score {
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}

.hud__timer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

.hud__timer-circle {
  width: 44px;
  height: 44px;
  position: absolute;
}

.hud__timer-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  z-index: 1;
}

.hud__timer-text.pulse {
  animation: pulse 1s infinite;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/HUD.ts
git commit -m "feat: HUD — щит, очки, круговой таймер"
```

---

### Task 14: UI — Главное меню и экран завершения

**Files:**
- Create: `src/ui/MenuScreen.ts`
- Create: `src/ui/GameOverScreen.ts`

- [ ] **Step 1: Создать src/ui/MenuScreen.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { GameMode } from '@/types/game';

/** Главное меню */
export class MenuScreen {
  private element!: HTMLElement;
  private container: HTMLElement;

  constructor(
    private eventBus: EventBus,
    uiLayer: HTMLElement,
  ) {
    this.container = uiLayer;
    this.build();
  }

  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'menu-screen';
    this.element.className = 'screen';
    this.element.innerHTML = `
      <div class="screen__content">
        <div class="screen__title">🛡️</div>
        <h1 class="screen__heading">Anti-Fraud Shield</h1>
        <div class="screen__actions">
          <button class="btn btn--primary" id="btn-classic">🏆 Классика</button>
          <button class="btn btn--secondary" id="btn-training">🔰 Обучение</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#btn-classic')?.addEventListener('click', () => {
      this.eventBus.emit('game:state', GameMode.ClassicInit);
    });

    this.element.querySelector('#btn-training')?.addEventListener('click', () => {
      this.eventBus.emit('game:state', GameMode.Training);
    });
  }

  /** Показать меню */
  show(): void {
    this.element.style.display = 'flex';
  }

  /** Скрыть меню */
  hide(): void {
    this.element.style.display = 'none';
  }
}
```

- [ ] **Step 2: Создать src/ui/GameOverScreen.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { GameMode, GameResult } from '@/types/game';

/** Экран завершения игры */
export class GameOverScreen {
  private element!: HTMLElement;
  private container: HTMLElement;

  constructor(
    private eventBus: EventBus,
    uiLayer: HTMLElement,
  ) {
    this.container = uiLayer;
    this.build();
  }

  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'gameover-screen';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="screen__content">
        <div class="screen__title">🛡️</div>
        <h2 class="screen__heading">Игра завершена</h2>
        <div class="screen__stats">
          <div class="stat">
            <span class="stat__value" id="go-score">0</span>
            <span class="stat__label">Очки</span>
          </div>
          <div class="stat">
            <span class="stat__value" id="go-accuracy">0%</span>
            <span class="stat__label">Точность</span>
          </div>
          <div class="stat">
            <span class="stat__value" id="go-shield">0</span>
            <span class="stat__label">Щит</span>
          </div>
        </div>
        <div class="screen__actions">
          <button class="btn btn--primary" id="go-retry">🔄 Ещё раз</button>
          <button class="btn btn--secondary" id="go-menu">🏠 Меню</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#go-retry')?.addEventListener('click', () => {
      this.hide();
      this.eventBus.emit('game:state', GameMode.ClassicInit);
    });

    this.element.querySelector('#go-menu')?.addEventListener('click', () => {
      this.hide();
      this.eventBus.emit('game:state', GameMode.Menu);
    });
  }

  /** Показать с результатами */
  show(result: GameResult): void {
    this.element.querySelector('#go-score')!.textContent = `${result.score}`;
    this.element.querySelector('#go-accuracy')!.textContent = `${Math.round(result.accuracy)}%`;
    this.element.querySelector('#go-shield')!.textContent = `${result.shield}`;
    this.element.style.display = 'flex';
  }

  /** Скрыть */
  hide(): void {
    this.element.style.display = 'none';
  }
}
```

Добавить стили экранов в `src/styles/main.css`:

```css
/* ===== Экраны (меню, game over) ===== */
.screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.95);
  z-index: 100;
  backdrop-filter: blur(8px);
}

.screen__content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--spacing-unit) * 3);
}

.screen__title {
  font-size: 64px;
}

.screen__heading {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
}

.screen__actions {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 2);
  min-width: 240px;
}

/* Статистика */
.screen__stats {
  display: flex;
  gap: calc(var(--spacing-unit) * 4);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat__value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-safe);
}

.stat__label {
  font-size: 12px;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/MenuScreen.ts src/ui/GameOverScreen.ts
git commit -m "feat: главное меню и экран завершения"
```

---

### Task 15: Точка входа (main.ts) — Сборка всех систем

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Переписать src/main.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { GameStateMachine } from '@/core/GameStateMachine';
import { GameLoop } from '@/core/GameLoop';
import { Timer } from '@/core/Timer';
import { CardPool } from '@/entities/CardPool';
import { CardSpawner } from '@/entities/CardSpawner';
import { CardGenerator } from '@/entities/CardGenerator';
import { InputSystem } from '@/systems/InputSystem';
import { ScoreManager } from '@/systems/ScoreManager';
import { DifficultyEngine } from '@/systems/DifficultyEngine';
import { ParticleCanvas } from '@/systems/ParticleCanvas';
import { HUD } from '@/ui/HUD';
import { MenuScreen } from '@/ui/MenuScreen';
import { GameOverScreen } from '@/ui/GameOverScreen';
import { GameMode, GameResult } from '@/types/game';
import { transactionTemplates } from '@/config/transactions';
import '@/styles/main.css';

// === Инициализация DOM ===
const uiLayer = document.getElementById('ui-layer')!;
const gameField = document.getElementById('game-field')!;
const cardContainer = document.getElementById('card-container')!;
const hudLayer = document.getElementById('hud-layer')!;

// === Ядро ===
const eventBus = new EventBus();
const stateMachine = new GameStateMachine(eventBus);
const gameLoop = new GameLoop(update, render);
const timer = new Timer(eventBus);

// === Сущности ===
const cardPool = new CardPool();
cardPool.init(cardContainer);

const generator = new CardGenerator(transactionTemplates);
const spawner = new CardSpawner(eventBus, cardPool, generator);

// === Системы ===
const inputSystem = new InputSystem(eventBus, cardPool, cardContainer);
const scoreManager = new ScoreManager(eventBus);
const difficultyEngine = new DifficultyEngine(eventBus);
const particleCanvas = new ParticleCanvas('particle-layer');

// === UI ===
const menuScreen = new MenuScreen(eventBus, uiLayer);
const gameOverScreen = new GameOverScreen(eventBus, uiLayer);
const hud = new HUD(eventBus, timer, hudLayer);

// === Зона решения ===
const decisionZone = document.createElement('div');
decisionZone.className = 'decision-zone';
gameField.appendChild(decisionZone);
const DECISION_ZONE_HEIGHT = 40;

// === Управление состояниями ===
eventBus.on('game:state', (mode) => {
  switch (mode) {
    case GameMode.Menu:
      gameLoop.stop();
      timer.reset();
      hud.hide();
      gameOverScreen.hide();
      menuScreen.show();
      break;

    case GameMode.ClassicInit:
      // Сбросить состояние игры
      scoreManager.reset();
      timer.reset();
      cardPool.getActive().forEach((c) => cardPool.release(c));
      particleCanvas.spawn(0, 0, 'transparent', 0); // Очистка

      // Перейти в Game
      stateMachine.transition(GameMode.Game);
      break;

    case GameMode.Game:
      menuScreen.hide();
      gameOverScreen.hide();
      hud.show();
      inputSystem.init();
      timer.start(60);
      gameLoop.start();
      break;

    case GameMode.Paused:
      gameLoop.pause();
      timer.pause();
      break;

    case GameMode.GameOver: {
      gameLoop.stop();
      timer.reset();
      inputSystem.destroy();
      hud.hide();

      const state = scoreManager.getState();
      const result: GameResult = {
        score: state.score,
        accuracy: state.accuracy,
        time: timer.getTotal(),
        shield: state.shield,
      };
      gameOverScreen.show(result);
      break;
    }
  }
});

// === Обработка событий игры ===
eventBus.on('card:blocked', (card) => {
  // Визуальный эффект
  const rect = card.element.getBoundingClientRect();
  const fieldRect = gameField.getBoundingClientRect();

  if (card.type === 'risk') {
    // Зелёные частицы
    particleCanvas.spawn(
      rect.left - fieldRect.left + rect.width / 2,
      rect.top - fieldRect.top + rect.height / 2,
      '#22c55e',
      15,
    );
    card.element.className = 'card card--blocked';
  } else {
    // Красная вспышка
    card.element.className = 'card card--error';
    flashScreen('error');
  }

  // Вернуть в пул через анимацию
  setTimeout(() => {
    eventBus.emit('card:recycle', card);
  }, 300);
});

eventBus.on('card:passed', (card) => {
  if (card.type === 'risk') {
    flashScreen('error');
  }
  card.element.className = 'card card--passed';

  setTimeout(() => {
    eventBus.emit('card:recycle', card);
  }, 300);
});

eventBus.on('card:recycle', (card) => {
  cardPool.release(card);
});

eventBus.on('timer:expired', () => {
  stateMachine.transition(GameMode.GameOver);
});

eventBus.on('shield:changed', ({ value }) => {
  if (value <= 0) {
    stateMachine.transition(GameMode.GameOver);
  }
});

// === Игровой цикл ===
function update(dt: number): void {
  if (!stateMachine.isRunning()) return;

  // Обновить сложность
  const elapsed = timer.getTotal() - timer.getRemaining();
  const diff = difficultyEngine.update(elapsed);
  spawner.setSpawnInterval(diff.spawnInterval);

  // Спавн
  spawner.update(dt);

  // Обновить карточки
  const activeCards = cardPool.getActive();
  const fieldHeight = gameField.clientHeight;

  for (const card of activeCards) {
    card.speed = diff.fallSpeed;
    card.y += card.speed * dt;
    card.element.style.transform = `translateY(${card.y}px)`;

    // Проверка зоны решения
    if (card.y > fieldHeight - DECISION_ZONE_HEIGHT) {
      eventBus.emit('card:passed', card);
    }
  }

  // Таймер
  timer.update(dt);

  // HUD
  hud.update();
}

function render(dt: number): void {
  particleCanvas.update(dt);
  particleCanvas.render();
}

// === Вспомогательные ===
function flashScreen(type: 'error' | 'success'): void {
  const flash = document.createElement('div');
  flash.className = type === 'error' ? 'error-flash' : 'success-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 400);
}

// === Запуск ===
stateMachine.transition(GameMode.Menu);
```

- [ ] **Step 2: Проверить сборку**

```bash
npm run build
```

Ожидаемый результат: без ошибок TypeScript, дистрибутив в `dist/`.

- [ ] **Step 3: Проверить запуск**

```bash
npm run dev
```

Ожидаемый результат:
- Открывается главное меню с кнопками «Классика» и «Обучение»
- Клик «Классика» → запускается игра
- Падают карточки с иконками, суммами, локациями
- Клик по карточке = блокировка (зелёные частицы для риска, красная вспышка для нормы)
- Пропуск карточки вниз = пропуск
- HUD показывает щит, очки, таймер
- Таймер истекает или щит = 0 → экран завершения

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "feat: точка входа — сборка всех систем, рабочий классический режим"
```

---

## Self-Review

### 1. Spec coverage

| Раздел спека | Task |
|--------------|------|
| Гибридный рендер (Canvas + DOM) | Task 1 (HTML), Task 12 (ParticleCanvas), Task 15 |
| Конечный автомат | Task 3 |
| EventBus с типизацией | Task 2 |
| GameLoop rAF | Task 4 |
| Timer | Task 5 |
| Пул 20 DOM | Task 8 |
| CardSpawner | Task 9 |
| InputSystem + дебаунс | Task 10 |
| ScoreManager + щит | Task 11 |
| DifficultyEngine | Task 11 |
| ParticleCanvas | Task 12 |
| HUD (щит, очки, таймер) | Task 13 |
| MenuScreen | Task 14 |
| GameOverScreen | Task 14 |
| CSS Custom Properties | Task 1 |
| Декларативная конфигурация | Task 7 |
| CardGenerator + RNG | Task 6, 7 |
| Доступность (tabindex, role, aria) | Task 1, 8 |
| prefers-reduced-motion | Task 1 |

Все пункты спека покрыты.

### 2. Placeholder scan

Проверил — нет TBD, TODO, "implement later". Все шаги содержат полный код.

### 3. Type consistency

- `GameMode`, `CardElement`, `CardData` — определены в Task 2, используются единообразно во всех задачах
- `EventBus` API: `on`, `off`, `emit`, `once` — консистентно
- `GameEvents` мапа — все события из спека определены
- Подписи методов `update(dt)`, `start()`, `stop()` — консистентны

### 4. Scope

План покрывает **ядро + классическую игру**. Обучение — отдельный план (План 2). Лидерборд — тоже позже. Это правильный scope для одного плана.
