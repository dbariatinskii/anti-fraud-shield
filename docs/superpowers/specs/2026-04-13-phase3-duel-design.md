# Архитектура Этапа 3 — Режим Дуэли

**Дата:** 2026-04-13
**Этап:** 3 (Дуэль, hot-seat)
**Статус:** На согласовании

---

## 1. Обзор

Режим дуэли для двух игроков на одном экране. Поочерёдные раунды по 60 секунд, серия до 2 побед (best of 3). Без внешних зависимостей.

### Принятые архитектурные решения

| Решение | Выбор | Обоснование |
|---------|-------|-------------|
| Формат | Hot-seat (по очереди на одном экране) | Не требует сетевого кода, соответствует MVP |
| Серия | Best of 3 (до 2 побед) | Короткая сессия (~3-5 минут), оптимально для демонстрации |
| Критерий победы | Очки → штраф за пропущенный риск → ничья | Просто и понятно |
| Имена игроков | Дефолтные «Игрок 1» / «Игрок 2» | Минимум кликов, быстрый старт |
| Переиспользование | ScoreManager, GameLoop, Timer, CardPool | Существующие компоненты без изменений |

---

## 2. Поток дуэли

```
Menu → DuelSetup (выбор: 1 раунд или Best of 3)
    ↓
DuelRoundStart (экран «Ход Игрока 1», счёт серии 0:0)
    ↓
DuelGame (60 секунд классики для Игрока 1)
    ↓
DuelRoundResult (результат раунда, кнопка «Готово для Игрока 2»)
    ↓
DuelRoundStart (экран «Ход Игрока 2», счёт серии обновлён)
    ↓
DuelGame (60 секунд для Игрока 2)
    ↓
DuelRoundResult → DuelCompare (side-by-side сравнение)
    ↓
[Если счёт ≠ 2:0] → следующий раунд с Игрока 1
[Если счёт = 2:0] → DuelWinner (экран победы)
    ↓
Menu
```

---

## 3. Новые состояния (GameMode)

```typescript
enum GameMode {
  // ... существующие ...
  DuelSetup = 'duel_setup',       // Выбор формата серии
  DuelRoundStart = 'duel_round',  // Экран «Ход Игрока N»
  DuelGame = 'duel_game',         // Игровой процесс дуэли (аналогично Game)
  DuelCompare = 'duel_compare',   // Сравнение результатов раунда
  DuelWinner = 'duel_winner',     // Экран победы серии
}
```

### Разрешённые переходы

```
Menu → DuelSetup
DuelSetup → DuelRoundStart
DuelRoundStart → DuelGame
DuelGame → DuelCompare
DuelCompare → DuelRoundStart (если серия не завершена)
DuelCompare → DuelWinner (если серия завершена)
DuelWinner → DuelSetup (ещё раз)
DuelWinner → Menu
DuelRoundStart → Menu (отмена)
```

---

## 4. Новые модули

### `src/types/duel.ts`

```typescript
export interface DuelPlayerResult {
  score: number;
  accuracy: number;
  missedRisks: number; // количество пропущенных рисков
}

export interface DuelState {
  bestOf: 1 | 3;
  currentRound: number;     // 1 или 2 (в серии из 3 максимум 3 раунда)
  currentPlayer: 1 | 2;     // чей сейчас ход
  player1Wins: number;      // побед игрока 1
  player2Wins: number;      // побед игрока 2
  roundResults: {
    player1: DuelPlayerResult | null;
    player2: DuelPlayerResult | null;
  };
}
```

### `src/systems/DuelManager.ts`

```typescript
export class DuelManager {
  private state: DuelState;

  constructor() { this.reset(); }

  init(bestOf: 1 | 3): void;
  nextRound(): void;          // Переключить на следующего игрока или раунд
  recordResult(player: 1 | 2, result: DuelPlayerResult): void;
  determineWinner(): 1 | 2 | 0; // 0 = ничья в раунде
  isSeriesOver(): boolean;
  getSeriesScore(): { p1: number; p2: number };
  reset(): void;
}
```

### `src/ui/DuelSetupScreen.ts`

Экран выбора формата: «1 раунд» или «Best of 3».

### `src/ui/DuelRoundStartScreen.ts`

Экран «Ход Игрока N» с индикатором счёта серии (например `1:0`).

### `src/ui/DuelCompareScreen.ts`

Side-by-side сравнение результатов раунда: очки, точность, пропущенные риски. Подсветка победителя раунда.

### `src/ui/DuelWinnerScreen.ts`

Экран победы серии: «🏆 Игрок 1 побеждает! 2:0». Кнопки «Ещё раз», «Меню».

---

## 5. Изменения в существующих файлах

| Файл | Изменение |
|------|-----------|
| `types/game.ts` | Добавить 5 новых значений в `GameMode` |
| `types/events.ts` | Добавить события `duel:round:complete`, `duel:series:complete` |
| `core/GameStateMachine.ts` | Добавить новые переходы |
| `ui/HUD.ts` | Добавить индикатор текущего игрока (Игрок 1 / Игрок 2) |
| `ui/MenuScreen.ts` | Добавить кнопку «⚔️ Дуэль» |
| `main.ts` | Кейсы для 5 новых состояний, интеграция DuelManager |
| `systems/ScoreManager.ts` | Добавить метод `getMissedRisks()` для подсчёта штрафов |

---

## 6. Логика определения победителя раунда

```typescript
function determineRoundWinner(p1: DuelPlayerResult, p2: DuelPlayerResult): 1 | 2 | 0 {
  // 1. Сравнение по очкам
  if (p1.score !== p2.score) {
    return p1.score > p2.score ? 1 : 2;
  }
  // 2. Сравнение по пропущенным рискам (меньше = лучше)
  if (p1.missedRisks !== p2.missedRisks) {
    return p1.missedRisks < p2.missedRisks ? 1 : 2;
  }
  // 3. Ничья
  return 0;
}
```

При ничьей никто не получает очко серии, серия продолжается.

---

## 7. CSS — новые стили

| Класс | Описание |
|-------|----------|
| `.duel-indicator` | Индикатор текущего игрока в HUD (цветовая пульсация) |
| `.duel-compare-row` | Строка сравнения в DuelCompare (подсветка лучшего значения) |
| `.duel-winner` | Экран победы (анимация, крупный трофей) |
| `.duel-score-badge` | Бейдж счёта серии на DuelRoundStart |

---

## 8. Ограничения и допущения

- **Hot-seat только** — два игрока за одним экраном, без сетевой синхронизации
- **Те же параметры классики** — 60 секунд, та же сложность для обоих игроков
- **Без серии best of 5** — только 1 раунд или best of 3
- **Без ввода имён** — дефолтные «Игрок 1» / «Игрок 2»
- **Ничья в раунде** — серия продолжается, никто не получает очко
