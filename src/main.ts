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
import { GameMode, GameResult, CardElement } from '@/types/game';
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
const menuScreen = new MenuScreen(eventBus, stateMachine, uiLayer);
const gameOverScreen = new GameOverScreen(eventBus, stateMachine, uiLayer);
const hud = new HUD(eventBus, timer, hudLayer);
hud.init();

// === Зона решения (визуальная полоса внизу игрового поля) ===
const decisionZone = document.createElement('div');
decisionZone.className = 'decision-zone';
gameField.appendChild(decisionZone);
const DECISION_ZONE_HEIGHT = 40;

// === Переменные для отслеживания paused ===
let isPaused = false;

// === Игровой цикл ===
const gameLoop = new GameLoop(update, render);

function update(dt: number): void {
  if (!stateMachine.isRunning() || isPaused) return;

  const elapsed = timer.getTotal() - timer.getRemaining();
  const diff = difficultyEngine.update(elapsed);
  spawner.setSpawnInterval(diff.spawnInterval);

  spawner.update(dt);

  const activeCards = cardPool.getActive();
  const fieldHeight = gameField.clientHeight;

  for (const card of activeCards) {
    card.speed = diff.fallSpeed;
    card.y += card.speed * dt;
    card.element.style.transform = `translateY(${card.y}px)`;

    // Пропуск: карточка достигла зоны решения и ещё не обработана
    if (!card.processed && card.y > fieldHeight - DECISION_ZONE_HEIGHT) {
      card.processed = true;
      eventBus.emit('card:passed', card);
    }
  }

  timer.update(dt);
  hud.update();
}

function render(dt: number): void {
  particleCanvas.update(dt);
  particleCanvas.render();
}

// === Управление состояниями ===
eventBus.on('game:state', (mode) => {
  switch (mode) {
    case GameMode.Menu:
      gameLoop.stop();
      isPaused = false;
      timer.reset();
      hud.hide();
      gameOverScreen.hide();
      menuScreen.show();
      break;

    case GameMode.ClassicInit:
      scoreManager.reset();
      timer.reset();
      isPaused = false;
      cardPool.getActive().forEach((c) => cardPool.release(c));
      stateMachine.transition(GameMode.Game);
      break;

    case GameMode.Game:
      menuScreen.hide();
      gameOverScreen.hide();
      hud.show();

      // Resume из паузы или новый запуск?
      if (isPaused) {
        // Возобновляем paused-сессию
        isPaused = false;
        timer.resume();
        inputSystem.init();
        return;
      }

      // Полный запуск новой игры
      inputSystem.init();
      timer.start(60);
      gameLoop.start();
      break;

    case GameMode.Paused:
      isPaused = true;
      timer.pause();
      break;

    case GameMode.GameOver: {
      gameLoop.stop();
      isPaused = false;
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

    // === Заглушки для будущих режимов ===
    case GameMode.Training:
      // TODO: Реализовать режим обучения (Этап 2 плана)
      // - Фиксированная низкая скорость
      // - Подсказки при наведении
      // - Прогресс-бар из 20 транзакций
      // - Финальная сводка с паттернами
      console.warn('[TrainingMode] Not implemented yet');
      stateMachine.transition(GameMode.Menu);
      break;

    case GameMode.Leaderboard:
      // TODO: Реализовать таблицу рекордов (Этап 2 плана)
      // - localStorage хранилище
      // - Сортировка по очкам/точности
      // - Фильтрация по периодам
      // - Экспорт карточки результата
      console.warn('[Leaderboard] Not implemented yet');
      stateMachine.transition(GameMode.Menu);
      break;
  }
});

// === Обработка событий игры ===
eventBus.on('card:blocked', (card: CardElement) => {
  // Защита от двойной обработки (если карточка уже ушла в decision zone)
  if (card.processed) return;
  card.processed = true;

  const rect = card.element.getBoundingClientRect();
  const fieldRect = gameField.getBoundingClientRect();

  if (card.type === 'risk') {
    particleCanvas.spawn(
      rect.left - fieldRect.left + rect.width / 2,
      rect.top - fieldRect.top + rect.height / 2,
      '#22c55e',
      15,
    );
    card.element.className = 'card card--blocked';
  } else {
    card.element.className = 'card card--error';
    flashScreen('error');
  }

  setTimeout(() => {
    eventBus.emit('card:recycle', card);
  }, 300);
});

eventBus.on('card:passed', (card: CardElement) => {
  // Дополнительная защита: если уже обработана кликом — пропускаем
  if (card.processed) return;

  if (card.type === 'risk') {
    flashScreen('error');
  }
  card.element.className = 'card card--passed';

  setTimeout(() => {
    eventBus.emit('card:recycle', card);
  }, 300);
});

eventBus.on('card:recycle', (card: CardElement) => {
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

// === Вспомогательные ===
function flashScreen(type: 'error' | 'success'): void {
  const flash = document.createElement('div');
  flash.className = type === 'error' ? 'error-flash' : 'success-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 400);
}

// === Запуск — показываем главное меню
// GameStateMachine уже в состоянии Menu по умолчанию, просто показываем UI
menuScreen.show();
