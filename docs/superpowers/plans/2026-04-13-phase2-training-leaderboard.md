# Этап 2: Обучение + Лидерборд + Пауза — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить режим обучения (автодемо + практика + сводка), таблицу рекордов с фильтрацией и текстовым шерингом, и кнопку паузы в игру.

**Architecture:** Три независимых подсистемы поверх существующего MVP. Обучение — отдельный flow с TrainingScenario, TrainingIntro, TrainingOverlay, TrainingSummary. Лидерборд — localStorage CRUD с фильтрацией. Пауза — overlay поверх HUD + интеграция в GameLoop.

**Tech Stack:** TypeScript (strict), Vite, localStorage, Clipboard API, существующие EventBus/GameStateMachine.

---

## Карта файлов

| Файл | Действие | Ответственность |
|------|----------|----------------|
| `src/types/leaderboard.ts` | Create | LeaderboardEntry, LeaderboardFilter, LeaderboardSortBy |
| `src/types/events.ts` | Modify | Добавить события learning и leaderboard |
| `src/config/training-scenarios.ts` | Create | 3 автодемо шага + 20 карточек практики |
| `src/entities/TrainingScenario.ts` | Create | Генерация шагов обучения |
| `src/entities/CardPool.ts` | Modify | Добавить peek() |
| `src/systems/Leaderboard.ts` | Create | localStorage CRUD, фильтрация, сортировка |
| `src/systems/ShareService.ts` | Create | Генерация текста + clipboard |
| `src/ui/TrainingIntro.ts` | Create | Автодемо 3 примеров |
| `src/ui/TrainingOverlay.ts` | Create | Практика с подсказками + прогресс-бар |
| `src/ui/TrainingSummary.ts` | Create | Финальная сводка паттернов |
| `src/ui/LeaderboardScreen.ts` | Create | Таблица рекордов + фильтры + шеринг |
| `src/ui/HUD.ts` | Modify | Кнопка паузы ⏸ |
| `src/core/PauseOverlay.ts` | Create | Overlay паузы |
| `src/main.ts` | Modify | Кейсы Training, Leaderboard, Paused (resume), сохранение в лидерборд |
| `src/styles/main.css` | Modify | Стили обучения, лидерборда, паузы |

---

### Task 1: Типы лидерборда и события

**Files:**
- Create: `src/types/leaderboard.ts`
- Modify: `src/types/events.ts`

- [ ] **Step 1: Создать src/types/leaderboard.ts**

```typescript
/** Запись в таблице рекордов */
export interface LeaderboardEntry {
  id: string;
  score: number;
  accuracy: number;
  shield: number;
  time: number;
  date: string; // ISO date string
}

/** Фильтр по времени */
export type LeaderboardFilter = 'today' | 'week' | 'all';

/** Поле сортировки */
export type LeaderboardSortBy = 'score' | 'accuracy' | 'date';
```

- [ ] **Step 2: Добавить события в src/types/events.ts**

Открыть `src/types/events.ts` и добавить в интерфейс `GameEvents`:

```typescript
  // Обучение
  'training:intro:complete': void;
  'training:step': { current: number; total: number; correct: boolean };
  'training:complete': { correct: number; mistakes: number; patternStats: Record<string, { correct: number; total: number }> };

  // Лидерборд
  'leaderboard:saved': LeaderboardEntry;
```

И добавить импорт:

```typescript
import { LeaderboardEntry } from '@/types/leaderboard';
```

- [ ] **Step 3: Commit**

```bash
git add src/types/leaderboard.ts src/types/events.ts
git commit -m "feat: типы лидерборда и события обучения"
```

---

### Task 2: Сценарии обучения

**Files:**
- Create: `src/config/training-scenarios.ts`
- Create: `src/entities/TrainingScenario.ts`

- [ ] **Step 1: Создать src/config/training-scenarios.ts**

```typescript
import { CardData } from '@/types/game';

/** Шаг автодемо: карточка + ожидаемое действие + объяснение */
export interface DemoStep {
  card: CardData;
  action: 'block' | 'pass';
  explanation: string;
}

/** Фиксированные шаги автодемо (3 примера) */
export const demoSteps: DemoStep[] = [
  {
    card: {
      id: 'demo-1',
      type: 'risk',
      icon: 'globe',
      amount: 250_000,
      location: '🌍 За рубежом',
      riskFactors: ['international', 'largeAmount'],
    },
    action: 'block',
    explanation: 'Крупный международный перевод — высокий риск мошенничества',
  },
  {
    card: {
      id: 'demo-2',
      type: 'norm',
      icon: 'card',
      amount: 2_500,
      location: '🏪 Местный магазин',
      riskFactors: [],
    },
    action: 'pass',
    explanation: 'Обычная локальная покупка — легитимная транзакция',
  },
  {
    card: {
      id: 'demo-3',
      type: 'norm',
      icon: 'shopping',
      amount: 8_000,
      location: '🛒 Супермаркет',
      riskFactors: [],
    },
    action: 'pass',
    explanation: 'Покупка в магазине — если заблокировать, потеряете очки',
  },
];

/** 20 фиксированных карточек для практики (покрытие всех паттернов) */
export const practiceCards: CardData[] = [
  // Риск (10 карточек)
  { id: 'p-1', type: 'risk', icon: 'globe', amount: 150_000, location: '🌍 За рубежом', riskFactors: ['international'] },
  { id: 'p-2', type: 'risk', icon: 'clock', amount: 45_000, location: '🌙 Ночью', riskFactors: ['nightTime'] },
  { id: 'p-3', type: 'risk', icon: 'zap', amount: 5_000, location: '🔄 Несколько подряд', riskFactors: ['rapidSuccession'] },
  { id: 'p-4', type: 'risk', icon: 'alert', amount: 500_000, location: '⚠️ Неизвестный', riskFactors: ['newMerchant'] },
  { id: 'p-5', type: 'risk', icon: 'globe', amount: 320_000, location: '🌍 За рубежом', riskFactors: ['international'] },
  { id: 'p-6', type: 'risk', icon: 'clock', amount: 78_000, location: '🌙 Ночью', riskFactors: ['nightTime'] },
  { id: 'p-7', type: 'risk', icon: 'zap', amount: 12_000, location: '🔄 Несколько подряд', riskFactors: ['rapidSuccession'] },
  { id: 'p-8', type: 'risk', icon: 'alert', amount: 800_000, location: '⚠️ Неизвестный', riskFactors: ['newMerchant'] },
  { id: 'p-9', type: 'risk', icon: 'globe', amount: 95_000, location: '🌍 За рубежом', riskFactors: ['international'] },
  { id: 'p-10', type: 'risk', icon: 'clock', amount: 33_000, location: '🌙 Ночью', riskFactors: ['nightTime'] },
  // Норма (10 карточек)
  { id: 'p-11', type: 'norm', icon: 'card', amount: 1_200, location: '🏪 Местный магазин', riskFactors: [] },
  { id: 'p-12', type: 'norm', icon: 'shopping', amount: 4_500, location: '🛒 Супермаркет', riskFactors: [] },
  { id: 'p-13', type: 'norm', icon: 'phone', amount: 299, location: '📱 Онлайн-сервис', riskFactors: [] },
  { id: 'p-14', type: 'norm', icon: 'home', amount: 3_200, location: '🏠 Коммунальные', riskFactors: [] },
  { id: 'p-15', type: 'norm', icon: 'card', amount: 800, location: '🏪 Местный магазин', riskFactors: [] },
  { id: 'p-16', type: 'norm', icon: 'shopping', amount: 7_800, location: '🛒 Супермаркет', riskFactors: [] },
  { id: 'p-17', type: 'norm', icon: 'phone', amount: 199, location: '📱 Онлайн-сервис', riskFactors: [] },
  { id: 'p-18', type: 'norm', icon: 'home', amount: 5_400, location: '🏠 Коммунальные', riskFactors: [] },
  { id: 'p-19', type: 'norm', icon: 'card', amount: 2_100, location: '🏪 Местный магазин', riskFactors: [] },
  { id: 'p-20', type: 'norm', icon: 'shopping', amount: 11_000, location: '🛒 Супермаркет', riskFactors: [] },
];
```

- [ ] **Step 2: Создать src/entities/TrainingScenario.ts**

```typescript
import { CardData } from '@/types/game';
import { DemoStep, demoSteps, practiceCards } from '@/config/training-scenarios';

/** Сценарий обучения: автодемо + практика */
export class TrainingScenario {
  /** Получить шаги автодемо (3 примера) */
  getIntroSteps(): DemoStep[] {
    return demoSteps;
  }

  /** Получить карточки для практики (20 штук) */
  getPracticeCards(): CardData[] {
    return practiceCards;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/config/training-scenarios.ts src/entities/TrainingScenario.ts
git commit -m "feat: сценарии обучения — автодемо + 20 карточек практики"
```

---

### Task 3: Система лидерборда (localStorage)

**Files:**
- Create: `src/systems/Leaderboard.ts`
- Create: `src/systems/ShareService.ts`

- [ ] **Step 1: Создать src/systems/Leaderboard.ts**

```typescript
import { LeaderboardEntry, LeaderboardFilter, LeaderboardSortBy } from '@/types/leaderboard';

/** Управление таблицей рекордов в localStorage */
export class Leaderboard {
  private readonly STORAGE_KEY = 'antifraud_leaderboard';
  private readonly MAX_ENTRIES = 50;

  /** Сохранить результат */
  save(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry {
    const fullEntry: LeaderboardEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
    };

    const entries = this.getAll('all');
    entries.unshift(fullEntry);

    // Ограничить количество записей
    if (entries.length > this.MAX_ENTRIES) {
      entries.length = this.MAX_ENTRIES;
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    return fullEntry;
  }

  /** Получить все записи с фильтром и сортировкой */
  getAll(filter: LeaderboardFilter = 'all', sortBy: LeaderboardSortBy = 'score'): LeaderboardEntry[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    let entries: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];

    // Фильтрация по дате
    const now = new Date();
    if (filter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      entries = entries.filter((e) => e.date >= today);
    } else if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      entries = entries.filter((e) => e.date >= weekAgo);
    }

    // Сортировка
    entries.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'accuracy') return b.accuracy - a.accuracy;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return entries;
  }

  /** Получить лучший результат игрока (по очкам) */
  getPersonalBest(): LeaderboardEntry | null {
    const entries = this.getAll('all', 'score');
    return entries.length > 0 ? entries[0] : null;
  }

  /** Очистить все записи */
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
```

- [ ] **Step 2: Создать src/systems/ShareService.ts**

```typescript
import { LeaderboardEntry } from '@/types/leaderboard';

/** Сервис для генерации текста результата и копирования в буфер */
export class ShareService {
  /** Сгенерировать текстовое представление результата */
  static generateText(entry: LeaderboardEntry): string {
    return [
      '🛡️ Anti-Fraud Shield',
      '',
      `🏆 ${entry.score} очков`,
      `🎯 ${Math.round(entry.accuracy)}% точность`,
      `🛡️ Щит: ${entry.shield}`,
      `⏱ ${entry.time} секунд`,
    ].join('\n');
  }

  /** Скопировать текст в буфер обмена */
  static async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback для старых браузеров
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/systems/Leaderboard.ts src/systems/ShareService.ts
git commit -m "feat: система лидерборда (localStorage) и шеринг"
```

---

### Task 4: UI обучения — Автодемо

**Files:**
- Create: `src/ui/TrainingIntro.ts`

- [ ] **Step 1: Создать src/ui/TrainingIntro.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { DemoStep } from '@/config/training-scenarios';

/** Автодемо обучения: показывает 3 примера поочерёдно */
export class TrainingIntro {
  private element!: HTMLElement;
  private container: HTMLElement;
  private currentStep = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private eventBus: EventBus,
    uiLayer: HTMLElement,
  ) {
    this.container = uiLayer;
    this.build();
  }

  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'training-intro';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="screen__content">
        <div class="training-intro__label">Демонстрация</div>
        <div class="training-intro__card" id="ti-card"></div>
        <div class="training-intro__explanation" id="ti-explanation"></div>
        <div class="training-intro__progress">
          <span id="ti-step">1</span> / 3
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
  }

  /** Запустить автодемо */
  start(steps: DemoStep[]): void {
    this.currentStep = 0;
    this.element.style.display = 'flex';
    this.showStep(steps);
  }

  private showStep(steps: DemoStep[]): void {
    if (this.currentStep >= steps.length) {
      this.hide();
      this.eventBus.emit('training:intro:complete', undefined as void);
      return;
    }

    const step = steps[this.currentStep];
    const cardEl = this.element.querySelector('#ti-card')!;
    const explEl = this.element.querySelector('#ti-explanation')!;
    const stepEl = this.element.querySelector('#ti-step')!;

    // Показать карточку
    const icons: Record<string, string> = {
      globe: '🌐', clock: '🕐', zap: '⚡', alert: '⚠️',
      card: '💳', shopping: '🛒', phone: '📱', home: '🏠',
    };
    cardEl.innerHTML = `
      <div class="card card--${step.card.type}" style="position:static; display:flex;">
        <span class="card__icon">${icons[step.card.icon] || '💰'}</span>
        <span class="card__amount">${step.card.amount.toLocaleString('ru-RU')} ₽</span>
        <span class="card__location">${step.card.location}</span>
      </div>
    `;

    explEl.textContent = step.explanation;
    stepEl.textContent = `${this.currentStep + 1}`;

    // Автопереход через 5 секунд
    this.timer = setTimeout(() => {
      this.currentStep++;
      this.showStep(steps);
    }, 5000);
  }

  /** Скрыть */
  hide(): void {
    this.element.style.display = 'none';
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/TrainingIntro.ts
git commit -m "feat: UI автодемо обучения (3 примера)"
```

---

### Task 5: UI обучения — Практика с подсказками

**Files:**
- Create: `src/ui/TrainingOverlay.ts`

- [ ] **Step 1: Создать src/ui/TrainingOverlay.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { CardElement, CardData } from '@/types/game';
import { getIconInfo } from '@/config/icons';

/** Практика обучения: 20 карточек с подсказками при наведении */
export class TrainingOverlay {
  private element!: HTMLElement;
  private container: HTMLElement;
  private progressBar!: HTMLElement;
  private tooltip!: HTMLElement;
  private correct = 0;
  private mistakes = 0;
  private total = 0;
  private patternStats: Record<string, { correct: number; total: number }> = {};
  private activeCards: CardElement[] = [];

  constructor(
    private eventBus: EventBus,
    private uiLayer: HTMLElement,
    private cardContainer: HTMLElement,
  ) {
    this.container = uiLayer;
    this.build();
  }

  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'training-overlay';
    this.element.className = 'screen training-overlay--active';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="training-progress" id="training-progress"></div>
      <div class="training-tooltip" id="training-tooltip"></div>
    `;
    this.container.appendChild(this.element);

    this.progressBar = this.element.querySelector('#training-progress')!;
    this.tooltip = this.element.querySelector('#training-tooltip')!;
  }

  /** Начать практику */
  start(cards: CardData[]): void {
    this.correct = 0;
    this.mistakes = 0;
    this.total = cards.length;
    this.patternStats = {};
    this.element.style.display = 'flex';
    this.updateProgress();

    // Подсказки при наведении на карточки
    this.cardContainer.addEventListener('mouseenter', this.handleHover, true);
    this.cardContainer.addEventListener('mouseleave', this.handleHoverLeave, true);
  }

  /** Записать результат шага */
  recordStep(card: CardData, wasCorrect: boolean): void {
    this.total; // already set
    if (wasCorrect) {
      this.correct++;
    } else {
      this.mistakes++;
    }

    // Статистика по паттерну
    const pattern = card.label || card.icon;
    if (!this.patternStats[pattern]) {
      this.patternStats[pattern] = { correct: 0, total: 0 };
    }
    this.patternStats[pattern].total++;
    if (wasCorrect) {
      this.patternStats[pattern].correct++;
    }

    this.updateProgress();

    this.eventBus.emit('training:step', {
      current: this.correct + this.mistakes,
      total: this.total,
      correct: wasCorrect,
    });
  }

  /** Завершить практику */
  finish(): void {
    this.cardContainer.removeEventListener('mouseenter', this.handleHover, true);
    this.cardContainer.removeEventListener('mouseleave', this.handleHoverLeave, true);
    this.element.style.display = 'none';

    this.eventBus.emit('training:complete', {
      correct: this.correct,
      mistakes: this.mistakes,
      patternStats: this.patternStats,
    });
  }

  private updateProgress(): void {
    const done = this.correct + this.mistakes;
    const pct = this.total > 0 ? (done / this.total) * 100 : 0;
    this.progressBar.style.width = `${pct}%`;
  }

  private handleHover = (e: Event): void => {
    const target = e.target as HTMLElement;
    const cardEl = target.closest('.card');
    if (!cardEl || !cardEl.dataset.cardId) return;

    // Найти иконку карточки по data-атрибуту
    const iconEl = cardEl.querySelector('.card__icon');
    if (!iconEl) return;

    const iconText = iconEl.textContent || '';
    const iconMap: Record<string, string> = {
      '🌐': 'globe', '🕐': 'clock', '⚡': 'zap', '⚠️': 'alert',
      '💳': 'card', '🛒': 'shopping', '📱': 'phone', '🏠': 'home',
    };
    const iconKey = iconMap[iconText] || 'globe';
    const info = getIconInfo(iconKey);

    this.tooltip.textContent = info.description;
    this.tooltip.style.display = 'block';

    // Позиционировать тултип над карточкой
    const rect = cardEl.getBoundingClientRect();
    this.tooltip.style.left = `${rect.left}px`;
    this.tooltip.style.top = `${rect.top - 60}px`;
  };

  private handleHoverLeave = (): void => {
    this.tooltip.style.display = 'none';
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/TrainingOverlay.ts
git commit -m "feat: UI практики обучения с подсказками и прогресс-баром"
```

---

### Task 6: UI обучения — Финальная сводка

**Files:**
- Create: `src/ui/TrainingSummary.ts`

- [ ] **Step 1: Создать src/ui/TrainingSummary.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { GameMode } from '@/types/game';

/** Финальная сводка обучения */
export class TrainingSummary {
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
    this.element.id = 'training-summary';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="screen__content">
        <div class="screen__title">📊</div>
        <h2 class="screen__heading">Результаты обучения</h2>
        <div class="screen__stats" id="ts-stats"></div>
        <div class="training-patterns" id="ts-patterns"></div>
        <div class="screen__actions">
          <button class="btn btn--primary" id="ts-retry">🔄 Повторить</button>
          <button class="btn btn--secondary" id="ts-classic">🏆 В классический режим</button>
          <button class="btn btn--secondary" id="ts-menu">🏠 Меню</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#ts-retry')?.addEventListener('click', () => {
      this.hide();
      this.eventBus.emit('game:state', GameMode.Training);
    });

    this.element.querySelector('#ts-classic')?.addEventListener('click', () => {
      this.hide();
      this.eventBus.emit('game:state', GameMode.ClassicInit);
    });

    this.element.querySelector('#ts-menu')?.addEventListener('click', () => {
      this.hide();
      this.eventBus.emit('game:state', GameMode.Menu);
    });
  }

  /** Показать сводку */
  show(correct: number, mistakes: number, patternStats: Record<string, { correct: number; total: number }>): void {
    const statsEl = this.element.querySelector('#ts-stats')!;
    const patternsEl = this.element.querySelector('#ts-patterns')!;
    const total = correct + mistakes;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    statsEl.innerHTML = `
      <div class="stat">
        <span class="stat__value">${correct}</span>
        <span class="stat__label">Правильно</span>
      </div>
      <div class="stat">
        <span class="stat__value">${mistakes}</span>
        <span class="stat__label">Ошибки</span>
      </div>
      <div class="stat">
        <span class="stat__value">${accuracy}%</span>
        <span class="stat__label">Точность</span>
      </div>
    `;

    // Таблица паттернов
    const rows = Object.entries(patternStats)
      .map(([pattern, stats]) => {
        const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        const color = pct >= 80 ? 'var(--color-safe)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-risk)';
        return `<div class="training-pattern-row">
          <span>${pattern}</span>
          <span style="color:${color}">${stats.correct}/${stats.total} (${pct}%)</span>
        </div>`;
      })
      .join('');

    patternsEl.innerHTML = `<div class="training-patterns-list">${rows}</div>`;
    this.element.style.display = 'flex';
  }

  /** Скрыть */
  hide(): void {
    this.element.style.display = 'none';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/TrainingSummary.ts
git commit -m "feat: UI финальной сводки обучения"
```

---

### Task 7: UI лидерборда

**Files:**
- Create: `src/ui/LeaderboardScreen.ts`

- [ ] **Step 1: Создать src/ui/LeaderboardScreen.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { GameStateMachine } from '@/core/GameStateMachine';
import { GameMode } from '@/types/game';
import { Leaderboard } from '@/systems/Leaderboard';
import { ShareService } from '@/systems/ShareService';
import { LeaderboardFilter, LeaderboardSortBy } from '@/types/leaderboard';

/** Экран таблицы рекордов */
export class LeaderboardScreen {
  private element!: HTMLElement;
  private container: HTMLElement;
  private currentFilter: LeaderboardFilter = 'all';
  private currentSort: LeaderboardSortBy = 'score';

  constructor(
    private eventBus: EventBus,
    private stateMachine: GameStateMachine,
    private leaderboard: Leaderboard,
    uiLayer: HTMLElement,
  ) {
    this.container = uiLayer;
    this.build();
  }

  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'leaderboard-screen';
    this.element.className = 'screen';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="screen__content leaderboard-content">
        <h2 class="screen__heading">📊 Таблица рекордов</h2>
        <div class="leaderboard-controls">
          <div class="leaderboard-filters" id="lb-filters">
            <button class="btn btn--sm" data-filter="today">Сегодня</button>
            <button class="btn btn--sm" data-filter="week">Неделя</button>
            <button class="btn btn--sm active" data-filter="all">Всё время</button>
          </div>
          <div class="leaderboard-sort" id="lb-sort">
            <button class="btn btn--sm active" data-sort="score">Очки</button>
            <button class="btn btn--sm" data-sort="accuracy">Точность</button>
          </div>
        </div>
        <div class="leaderboard-list" id="lb-list"></div>
        <div class="leaderboard-share" id="lb-share" style="display:none;">
          <button class="btn btn--secondary" id="lb-copy">📋 Поделиться</button>
          <span class="leaderboard-copied" id="lb-copied" style="display:none;">Скопировано!</span>
        </div>
        <div class="screen__actions">
          <button class="btn btn--secondary" id="lb-menu">🏠 Меню</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    // Фильтры
    this.element.querySelector('#lb-filters')?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-filter]');
      if (!btn) return;
      this.currentFilter = btn.dataset.filter as LeaderboardFilter;
      this.element.querySelectorAll('#lb-filters .btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.render();
    });

    // Сортировка
    this.element.querySelector('#lb-sort')?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-sort]');
      if (!btn) return;
      this.currentSort = btn.dataset.sort as LeaderboardSortBy;
      this.element.querySelectorAll('#lb-sort .btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.render();
    });

    // Копировать
    this.element.querySelector('#lb-copy')?.addEventListener('click', async () => {
      const best = this.leaderboard.getPersonalBest();
      if (!best) return;
      const text = ShareService.generateText(best);
      await ShareService.copyToClipboard(text);
      const copied = this.element.querySelector('#lb-copied')!;
      copied.style.display = 'inline';
      setTimeout(() => { copied.style.display = 'none'; }, 2000);
    });

    // Меню
    this.element.querySelector('#lb-menu')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.Menu);
    });
  }

  /** Показать экран */
  show(): void {
    this.render();
    this.element.style.display = 'flex';
  }

  /** Скрыть */
  hide(): void {
    this.element.style.display = 'none';
  }

  private render(): void {
    const entries = this.leaderboard.getAll(this.currentFilter, this.currentSort);
    const best = this.leaderboard.getPersonalBest();
    const listEl = this.element.querySelector('#lb-list')!;
    const shareEl = this.element.querySelector('#lb-share')!;

    if (entries.length === 0) {
      listEl.innerHTML = '<div class="leaderboard-empty">Пока нет результатов. Сыграйте в классику!</div>';
      shareEl.style.display = 'none';
      return;
    }

    shareEl.style.display = 'block';

    const rows = entries.map((entry, i) => {
      const isBest = best && entry.id === best.id;
      const date = new Date(entry.date).toLocaleDateString('ru-RU');
      return `<div class="leaderboard-row ${isBest ? 'leaderboard-row--best' : ''}">
        <span class="leaderboard-rank">#${i + 1}</span>
        <span class="leaderboard-score">${entry.score}</span>
        <span class="leaderboard-accuracy">${Math.round(entry.accuracy)}%</span>
        <span class="leaderboard-date">${date}</span>
      </div>`;
    }).join('');

    listEl.innerHTML = `
      <div class="leaderboard-header">
        <span>#</span><span>Очки</span><span>Точность</span><span>Дата</span>
      </div>
      ${rows}
    `;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/LeaderboardScreen.ts
git commit -m "feat: UI таблицы рекордов с фильтрами и шерингом"
```

---

### Task 8: Overlay паузы

**Files:**
- Create: `src/core/PauseOverlay.ts`

- [ ] **Step 1: Создать src/core/PauseOverlay.ts**

```typescript
import { EventBus } from '@/core/EventBus';
import { GameStateMachine } from '@/core/GameStateMachine';
import { GameMode } from '@/types/game';

/** Оверлей паузы */
export class PauseOverlay {
  private element!: HTMLElement;
  private container: HTMLElement;

  constructor(
    private eventBus: EventBus,
    private stateMachine: GameStateMachine,
    uiLayer: HTMLElement,
  ) {
    this.container = uiLayer;
    this.build();
  }

  private build(): void {
    this.element = document.createElement('div');
    this.element.id = 'pause-overlay';
    this.element.className = 'pause-overlay';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="pause-overlay__content">
        <div class="pause-overlay__icon">⏸</div>
        <div class="pause-overlay__buttons">
          <button class="btn btn--primary" id="pause-resume">▶️ Продолжить</button>
          <button class="btn btn--secondary" id="pause-menu">🏠 Выйти в меню</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.querySelector('#pause-resume')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.Game);
    });

    this.element.querySelector('#pause-menu')?.addEventListener('click', () => {
      this.hide();
      this.stateMachine.transition(GameMode.Menu);
    });
  }

  /** Показать */
  show(): void {
    this.element.style.display = 'flex';
  }

  /** Скрыть */
  hide(): void {
    this.element.style.display = 'none';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/PauseOverlay.ts
git commit -m "feat: overlay паузы с кнопками продолжить/меню"
```

---

### Task 9: Кнопка паузы в HUD

**Files:**
- Modify: `src/ui/HUD.ts`

- [ ] **Step 1: Добавить кнопку паузы в HUD**

Открыть `src/ui/HUD.ts`. В методе `init()` изменить innerHTML — добавить кнопку ⏸ рядом с таймером:

Найти строку с `hud__timer` и заменить:

```typescript
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
        <button class="hud__pause-btn" id="hud-pause-btn" aria-label="Пауза">⏸</button>
      </div>
    `;
```

Добавить обработчик клика после `this.subscribe()`:

```typescript
    // Кнопка паузы
    this.element.querySelector('#hud-pause-btn')?.addEventListener('click', () => {
      this.eventBus.emit('game:paused', undefined as void);
    });
```

Добавить CSS стили (см. Task 12).

- [ ] **Step 2: Commit**

```bash
git add src/ui/HUD.ts
git commit -m "feat: кнопка паузы в HUD"
```

---

### Task 10: CSS стили для новых экранов

**Files:**
- Modify: `src/styles/main.css`

- [ ] **Step 1: Добавить стили в конец src/styles/main.css**

```css
/* ===== Обучение ===== */
.training-overlay--active {
  pointer-events: none;
  background: transparent;
  backdrop-filter: none;
}

.training-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: var(--color-safe);
  transition: width var(--transition-fast);
  z-index: 10;
}

.training-tooltip {
  position: absolute;
  display: none;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 8px 12px;
  border-radius: var(--card-radius);
  font-size: 12px;
  max-width: 200px;
  z-index: 200;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-neutral);
}

.training-intro__label {
  font-size: 14px;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 16px;
}

.training-intro__card {
  margin: 20px 0;
}

.training-intro__explanation {
  font-size: 16px;
  color: var(--color-text);
  margin: 16px 0;
  padding: 12px 24px;
  background: var(--color-surface);
  border-radius: var(--card-radius);
  border-left: 3px solid var(--color-warning);
}

.training-intro__progress {
  font-size: 14px;
  color: var(--color-text-dim);
  margin-top: 12px;
}

.training-patterns {
  width: 100%;
  max-width: 400px;
  margin: 16px 0;
}

.training-patterns-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.training-pattern-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--color-surface);
  border-radius: 8px;
  font-size: 14px;
}

/* ===== Лидерборд ===== */
.leaderboard-content {
  max-width: 500px;
  width: 100%;
}

.leaderboard-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.leaderboard-filters,
.leaderboard-sort {
  display: flex;
  gap: 4px;
}

.btn--sm {
  padding: 6px 12px;
  font-size: 12px;
  min-width: auto;
  min-height: auto;
}

.btn--sm.active {
  background: var(--color-safe);
  color: #000;
}

.leaderboard-list {
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  margin: 16px 0;
}

.leaderboard-header {
  display: grid;
  grid-template-columns: 40px 1fr 80px 80px;
  padding: 8px 12px;
  font-size: 11px;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--color-surface-light);
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 40px 1fr 80px 80px;
  padding: 8px 12px;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.leaderboard-row--best {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid var(--color-safe);
  border-radius: 8px;
}

.leaderboard-empty {
  text-align: center;
  color: var(--color-text-dim);
  padding: 32px;
  font-size: 14px;
}

.leaderboard-share {
  margin: 12px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.leaderboard-copied {
  color: var(--color-safe);
  font-size: 12px;
}

/* ===== Пауза ===== */
.pause-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 150;
}

.pause-overlay__content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.pause-overlay__icon {
  font-size: 64px;
}

.pause-overlay__buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}

/* ===== Кнопка паузы в HUD ===== */
.hud__pause-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-light);
  border: none;
  border-radius: 8px;
  color: var(--color-text);
  font-size: 16px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.hud__pause-btn:hover {
  background: var(--color-neutral);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/main.css
git commit -m "feat: CSS стили обучения, лидерборда, паузы"
```

---

### Task 11: Интеграция в main.ts

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Добавить импорты**

В начало `src/main.ts` добавить:

```typescript
import { TrainingScenario } from '@/entities/TrainingScenario';
import { TrainingIntro } from '@/ui/TrainingIntro';
import { TrainingOverlay } from '@/ui/TrainingOverlay';
import { TrainingSummary } from '@/ui/TrainingSummary';
import { Leaderboard } from '@/systems/Leaderboard';
import { LeaderboardScreen } from '@/ui/LeaderboardScreen';
import { PauseOverlay } from '@/core/PauseOverlay';
import { DemoStep } from '@/config/training-scenarios';
```

- [ ] **Step 2: Инициализировать новые компоненты**

После `const hud = new HUD(...)` добавить:

```typescript
// === Обучение ===
const trainingScenario = new TrainingScenario();
const trainingIntro = new TrainingIntro(eventBus, uiLayer);
const trainingOverlay = new TrainingOverlay(eventBus, uiLayer, cardContainer);
const trainingSummary = new TrainingSummary(eventBus, uiLayer);

// === Лидерборд ===
const leaderboard = new Leaderboard();
const leaderboardScreen = new LeaderboardScreen(eventBus, stateMachine, leaderboard, uiLayer);

// === Пауза ===
const pauseOverlay = new PauseOverlay(eventBus, stateMachine, uiLayer);
```

- [ ] **Step 3: Обновить switch по состояниям**

Добавить кейсы `Training`, `Leaderboard`, `Paused` (resume):

Найти кейс `GameMode.Game` и изменить:

```typescript
    case GameMode.Game:
      menuScreen.hide();
      gameOverScreen.hide();
      hud.show();

      // Resume из паузы или новый запуск?
      if (isPaused) {
        isPaused = false;
        timer.resume();
        inputSystem.init();
        pauseOverlay.hide();
        return;
      }

      // Полный запуск новой игры
      inputSystem.init();
      timer.start(60);
      gameLoop.start();
      break;
```

Добавить кейсы после `GameMode.GameOver`:

```typescript
    case GameMode.Training:
      menuScreen.hide();
      gameOverScreen.hide();
      hud.hide();

      // Этап 1: Автодемо
      const introSteps = trainingScenario.getIntroSteps();
      trainingIntro.start(introSteps);
      break;

    case GameMode.Leaderboard:
      menuScreen.hide();
      gameOverScreen.hide();
      hud.hide();
      leaderboardScreen.show();
      break;

    case GameMode.Paused:
      isPaused = true;
      timer.pause();
      pauseOverlay.show();
      break;
```

- [ ] **Step 4: Обработчики событий обучения**

Добавить после существующих обработчиков:

```typescript
// === Обработка событий обучения ===
eventBus.on('training:intro:complete', () => {
  // Этап 2: Практика с подсказками
  const practiceCards = trainingScenario.getPracticeCards();
  trainingOverlay.start(practiceCards);

  // Показать карточки на поле
  cardPool.init(cardContainer); // Уже инициализирован, просто показываем
  inputSystem.init();

  // Спавним карточки по одной с интервалом
  let practiceIndex = 0;
  const spawnPracticeCard = () => {
    if (practiceIndex >= practiceCards.length) {
      // Все карточки показаны, ждём обработки
      return;
    }
    const data = practiceCards[practiceIndex];
    const card = cardPool.acquire(data);
    if (card) {
      card.speed = 60; // Фиксированная низкая скорость
      card.y = -80;
      card.element.style.transform = `translateY(${card.y}px)`;
      card.element.style.left = `${30 + (practiceIndex % 5) * 10}%`;
      card.element.style.display = 'flex';
      card.element.className = `card card--${data.type} card--falling`;
      practiceIndex++;
    }
  };

  // Спавним карточки с интервалом 3 секунды
  const practiceInterval = setInterval(() => {
    if (practiceIndex < practiceCards.length) {
      spawnPracticeCard();
    } else {
      clearInterval(practiceInterval);
    }
  }, 3000);

  // Первая карточка сразу
  spawnPracticeCard();

  // Обработка кликов в обучении (без штрафов)
  const trainingClickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    const cardEl = target.closest('.card');
    if (!cardEl || !cardEl.dataset.cardId) return;

    const card = cardPool.findById(cardEl.dataset.cardId);
    if (!card || card.processed) return;
    card.processed = true;

    // В обучении: блок = правильно для риска, неправильно для нормы
    const isCorrect = card.type === 'risk';
    trainingOverlay.recordStep(
      { id: card.id, type: card.type, icon: '', amount: 0, location: '', riskFactors: [] },
      isCorrect
    );

    // Визуальный отклик
    if (isCorrect) {
      card.element.className = 'card card--blocked';
    } else {
      card.element.className = 'card card--error';
      flashScreen('error');
    }

    setTimeout(() => {
      cardPool.release(card);
    }, 500);
  };

  cardContainer.addEventListener('click', trainingClickHandler);

  // Сохраняем handler для cleanup
  (window as any).__trainingClickHandler = trainingClickHandler;
  (window as any).__practiceInterval = practiceInterval;
});

eventBus.on('training:complete', ({ correct, mistakes, patternStats }) => {
  // Очистка
  cardContainer.removeEventListener('click', (window as any).__trainingClickHandler);
  clearInterval((window as any).__practiceInterval);
  inputSystem.destroy();

  // Очистить карточки с поля
  cardPool.getActive().forEach((c) => cardPool.release(c));

  // Этап 3: Сводка
  trainingOverlay.finish();
  trainingSummary.show(correct, mistakes, patternStats);
});
```

- [ ] **Step 5: Сохранение в лидерборд при Game Over**

Найти кейс `GameMode.GameOver` и перед `gameOverScreen.show(result)` добавить:

```typescript
      // Сохранить результат в лидерборд
      leaderboard.save({
        score: state.score,
        accuracy: state.accuracy,
        shield: state.shield,
        time: timer.getTotal(),
      });
```

- [ ] **Step 6: Обработчик Escape для паузы**

Добавить после существующих обработчиков:

```typescript
// === Клавиша Escape для паузы ===
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (stateMachine.getCurrent() === GameMode.Game) {
      stateMachine.transition(GameMode.Paused);
    } else if (stateMachine.getCurrent() === GameMode.Paused) {
      stateMachine.transition(GameMode.Game);
    }
  }
});
```

- [ ] **Step 7: Проверить сборку**

```bash
npm run build
```

Ожидаемый результат: без ошибок.

- [ ] **Step 8: Commit**

```bash
git add src/main.ts
git commit -m "feat: интеграция обучения, лидерборда и паузы в main.ts"
```

---

## Self-Review

### 1. Spec coverage

| Раздел спека | Task |
|--------------|------|
| Автодемо (3 примера) | Task 2, 4 |
| Практика (20 карточек) | Task 2, 5 |
| Подсказки при наведении | Task 5 (TrainingOverlay handleHover) |
| Прогресс-бар | Task 5 (training-progress) |
| Финальная сводка | Task 6 |
| Лидерборд localStorage | Task 3 (Leaderboard.ts) |
| Фильтры (today/week/all) | Task 7 |
| Сортировка (score/accuracy) | Task 7 |
| Персональный рекорд | Task 3, 7 |
| Текстовый шеринг | Task 3 (ShareService) |
| Пауза overlay | Task 8 |
| Кнопка паузы в HUD | Task 9, 10 |
| Escape = toggle | Task 11 |
| События training/leaderboard | Task 1 |
| TrainingScenario | Task 2 |

Все пункты покрыты.

### 2. Placeholder scan

Нет TBD, TODO, "implement later". Все шаги содержат полный код.

### 3. Type consistency

- `LeaderboardEntry`, `LeaderboardFilter`, `LeaderboardSortBy` — определены в Task 1, используются в Task 3, 7, 11
- `GameEvents` — добавлены события в Task 1, используются в Task 4, 5, 6, 11
- `DemoStep` — определён в Task 2, используется в Task 4, 11
- `CardData` — используется единообразно
- `GameStateMachine` — передаётся в конструкторы UI-компонентов (Task 7, 8, 11)

### 4. Scope

План покрывает три подсистемы: Обучение (Tasks 2, 4-6), Лидерборд (Tasks 1, 3, 7), Пауза (Tasks 8-11). Каждая подсистема независима и может быть протестирована отдельно.
