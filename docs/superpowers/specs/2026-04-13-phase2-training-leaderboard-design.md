# Архитектура Этапа 2 — Обучение + Лидерборд

**Дата:** 2026-04-13
**Этап:** 2 (Обучение + Лидерборд + Пауза)
**Статус:** На согласовании

---

## 1. Обзор

Расширение MVP двумя режимами и улучшением UX. Без внешних зависимостей, на чистом TypeScript + Vite.

### Принятые архитектурные решения

| Решение | Выбор | Обоснование |
|---------|-------|-------------|
| Обучение | Автодемо (3 примера) → практика (20 карточек) → сводка | Соответствует требованию «показывай, не рассказывай» |
| Подсказки | Тултип при наведении на карточку | Ненавязчиво, использует существующий `config/icons.ts` |
| Лидерборд | localStorage + текстовый шеринг (clipboard API) | Без внешних зависимостей, решает задачу мотивации |
| Пауза | Overlay с затемнением, Esc = toggle | Стандартный паттерн, использует существующий `Paused` state |
| Сценарии обучения | 20 фиксированных карточек с гарантированным покрытием паттернов | Контролируемый опыт обучения, повторяемость |

---

## 2. Поток данных

### Обучение

```
Menu → TrainingIntro (автодемо 3 карточек, 5 сек каждая)
    ↓ emit('training:intro:complete')
    ↓
TrainingOverlay (практика: 20 карточек, подсказки при наведении)
    ↓ emit('training:complete', { correct, mistakes, patternStats })
    ↓
TrainingSummary (сводка: правильные/ошибки по каждому паттерну)
    ↓
Menu
```

### Лидерборд

```
Game Over → автоматически сохраняет результат → Leaderboard.save(result)
    ↓
Menu → LeaderboardScreen → LeaderboardScreen
    ↓
[Фильтры: сегодня / неделя / всё время]
[Сортировка: очки, точность]
[Кнопка "Поделиться" → clipboard: "🛡️ Anti-Fraud Shield: 150 очков, 85% точность"]
    ↓
Menu
```

### Пауза

```
Игра (Game) → Esc / кнопка ⏸ → Paused
    ↓
Esc / кнопка "Продолжить" → Game (resume)
Кнопка "Меню" → Menu (сессия теряется)
```

---

## 3. Новые модули

### `src/types/leaderboard.ts`

```typescript
export interface LeaderboardEntry {
  id: string;
  score: number;
  accuracy: number;
  shield: number;
  time: number;
  date: string; // ISO date
}

export type LeaderboardFilter = 'today' | 'week' | 'all';
export type LeaderboardSortBy = 'score' | 'accuracy' | 'date';
```

### `src/systems/Leaderboard.ts`

```typescript
export class Leaderboard {
  private readonly STORAGE_KEY = 'antifraud_leaderboard';
  private readonly MAX_ENTRIES = 50;

  save(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry
  getAll(filter: LeaderboardFilter): LeaderboardEntry[]
  getPersonalBest(): LeaderboardEntry | null
  clear(): void
}
```

### `src/systems/ShareService.ts`

```typescript
export class ShareService {
  static generateText(entry: LeaderboardEntry): string
  static copyToClipboard(text: string): Promise<void>
}
```

### `src/entities/TrainingScenario.ts`

```typescript
export interface TrainingStep {
  card: CardData;
  expectedResult: 'block' | 'pass';
  explanation: string;
}

export class TrainingScenario {
  getIntroSteps(): TrainingStep[]  // 3 автодемо
  getPracticeSteps(): CardData[]   // 20 карточек
}
```

### `src/ui/TrainingIntro.ts`

Автодемо: показывает 3 карточки поочерёдно с подсказками, без участия игрока.

### `src/ui/TrainingOverlay.ts`

Подсказки при наведении: при `mouseenter` на карточку показывает плашку с описанием паттерна из `config/icons.ts`.

### `src/ui/TrainingSummary.ts`

Финальная сводка: таблица паттернов с процентом правильных решений.

### `src/ui/LeaderboardScreen.ts`

Таблица рекордов с фильтрами, сортировкой, персональным рекордом и кнопкой шеринга.

### `src/core/PauseOverlay.ts`

Overlay с затемнением 60%, иконкой паузы, кнопками «Продолжить» и «Меню».

---

## 4. Структура файлов (добавления)

```
src/
├── types/
│   └── leaderboard.ts
├── core/
│   └── PauseOverlay.ts
├── entities/
│   └── TrainingScenario.ts
├── systems/
│   ├── Leaderboard.ts
│   └── ShareService.ts
├── ui/
│   ├── TrainingIntro.ts
│   ├── TrainingOverlay.ts
│   ├── TrainingSummary.ts
│   └── LeaderboardScreen.ts
├── config/
│   └── training-scenarios.ts
└── main.ts                     # Кейсы Training, Leaderboard, Paused (resume)
```

---

## 5. Обучение — детализация

### Автодемо (3 примера, ~15 сек)

1. **Риск → Блокировка:** Карточка 🌐 «Крупный международный перевод» → зелёная вспышка, частицы, текст «Правильно: заблокирован!»
2. **Норма → Пропуск:** Карточка 💳 «Обычная локальная покупка» → карточка уходит вниз, текст «Правильно: пропущена!»
3. **Ошибка:** Карточка 🛒 «Покупка в магазине» → игрок кликает (блокирует норму) → красная вспышка, текст «Ошибка: это легитимная транзакция»

Каждый пример показывается 5 секунд, затем автопереход.

### Практика (20 карточек)

- Фиксированная скорость: `fallSpeed = 60px/s`, `spawnInterval = 3s`
- Без штрафов за ошибки
- Подсказка при наведении: полупрозрачная плашка над карточкой с описанием иконки из `config/icons.ts`
- Прогресс-бар внизу: 20 сегментов, заполняются зелёным/красным
- После 20 карточек → TrainingSummary

### Финальная сводка

| Паттерн | Правильно | Ошибки | % |
|---------|-----------|--------|---|
| Международный перевод | 3/3 | 0 | 100% |
| Ночная транзакция | 2/3 | 1 | 67% |
| ... | ... | ... | ... |

Кнопки: «🔄 Повторить», «🏆 В классический режим», «🏠 Меню»

---

## 6. Лидерборд — детализация

### Хранение

```typescript
// localStorage: antifraud_leaderboard
[
  { id: "entry-1", score: 150, accuracy: 85, shield: 20, time: 60, date: "2026-04-13T10:30:00Z" },
  ...
]
```

Максимум 50 записей, старые удаляются.

### Фильтры

| Фильтр | Логика |
|--------|--------|
| Сегодня | `entry.date >= today` |
| Неделя | `entry.date >= today - 7 дней` |
| Всё время | Все записи |

### Сортировка

По умолчанию — по очкам (убывание). Переключатель: очки / точность / дата.

### Персональный рекорд

Лучший результат по очкам подсвечивается зелёной рамкой, вынесен в начало списка.

### Шеринг (текст)

```
🛡️ Anti-Fraud Shield
🏆 150 очков | 🎯 85% точность | 🛡️ Щит: 20
⏱ 60 секунд
```

Копируется в буфер обмена через `navigator.clipboard.writeText()`. Fallback: `prompt()` с текстом.

---

## 7. Пауза — детализация

### Trigger

- Клавиша `Escape` — toggle паузы
- Кнопка ⏸ в HUD (правый верхний угол, рядом с таймером)

### Overlay

- Затемнение фона 60% (`backdrop-filter: blur(4px)`)
- Центрированная иконка ⏸
- Кнопки: «▶️ Продолжить» (возобновляет), «🏠 Выйти в меню» (завершает без сохранения)

### Resume

- `timer.resume()` — возобновляет таймер
- `inputSystem.init()` — восстанавливает обработчики
- `isPaused = false` — снимает блокировку game loop

---

## 8. Изменения в существующих файлах

| Файл | Изменение |
|------|-----------|
| `types/events.ts` | Добавить `leaderboard:saved`, `training:complete`, `training:intro:complete` |
| `main.ts` | Реализовать кейсы `GameMode.Training`, `GameMode.Leaderboard`, `GameMode.Paused` (resume) |
| `config/icons.ts` | Уже готов — используем `description` для подсказок |
| `entities/CardPool.ts` | Добавить метод `peek(): boolean` (есть ли свободный слот) |
| `ui/HUD.ts` | Добавить кнопку паузы ⏸ |
| `core/GameStateMachine.ts` | Без изменений (переходы уже описаны) |

---

## 9. Ограничения и допущения

- **Без PNG-карточки** — текстовый шеринг через clipboard API (без внешних зависимостей)
- **20 карточек в обучении** — фиксированный набор, не рандом
- **Максимум 50 записей** в лидерборде — достаточно для MVP
- **Автодемо без участия** — игрок только смотрит, клики игнорируются
- **Подсказки только в обучении** — в классике подсказок нет
