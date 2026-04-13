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
import { TrainingScenario } from '@/entities/TrainingScenario';
import { TrainingIntro } from '@/ui/TrainingIntro';
import { TrainingOverlay } from '@/ui/TrainingOverlay';
import { TrainingSummary } from '@/ui/TrainingSummary';
import { Leaderboard } from '@/systems/Leaderboard';
import { LeaderboardScreen } from '@/ui/LeaderboardScreen';
import { PauseOverlay } from '@/core/PauseOverlay';
import { DuelManager } from '@/systems/DuelManager';
import { DuelSetupScreen } from '@/ui/DuelSetupScreen';
import { DuelRoundStartScreen } from '@/ui/DuelRoundStartScreen';
import { DuelCompareScreen } from '@/ui/DuelCompareScreen';
import { DuelWinnerScreen } from '@/ui/DuelWinnerScreen';
import { DuelPlayerResult } from '@/types/duel';
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
const scoreManager = new ScoreManager(eventBus, stateMachine);
const difficultyEngine = new DifficultyEngine(eventBus);
const particleCanvas = new ParticleCanvas('particle-layer');

// === UI ===
const menuScreen = new MenuScreen(eventBus, stateMachine, uiLayer);
const gameOverScreen = new GameOverScreen(eventBus, stateMachine, uiLayer);
const hud = new HUD(eventBus, timer, hudLayer);
hud.init();

// === Обучение ===
const trainingScenario = new TrainingScenario();
const trainingIntro = new TrainingIntro(eventBus, uiLayer);
const trainingOverlay = new TrainingOverlay(eventBus, uiLayer, cardContainer);
const trainingSummary = new TrainingSummary(eventBus, stateMachine, uiLayer);

// === Лидерборд ===
const leaderboard = new Leaderboard();
const leaderboardScreen = new LeaderboardScreen(eventBus, stateMachine, leaderboard, uiLayer);

// === Дуэль ===
const duelManager = new DuelManager();
const duelSetupScreen = new DuelSetupScreen(stateMachine, uiLayer);
const duelRoundStartScreen = new DuelRoundStartScreen(stateMachine, uiLayer);
const duelCompareScreen = new DuelCompareScreen(stateMachine, uiLayer);
const duelWinnerScreen = new DuelWinnerScreen(stateMachine, uiLayer);

// === Пауза ===
const pauseOverlay = new PauseOverlay(eventBus, stateMachine, uiLayer);

// === Зона решения (визуальная полоса внизу игрового поля) ===
const decisionZone = document.createElement('div');
decisionZone.className = 'decision-zone';
gameField.appendChild(decisionZone);
const DECISION_ZONE_HEIGHT = 40;

// === Переменные для отслеживания paused и обучения ===
let isPaused = false;
let trainingClickHandler: ((e: Event) => void) | null = null;
let practiceInterval: ReturnType<typeof setInterval> | null = null;

// === Игровой цикл ===
const gameLoop = new GameLoop(update, render);

function update(dt: number): void {
  if (isPaused) return;

  const currentMode = stateMachine.getCurrent();

  // Классическая игра
  if (currentMode === GameMode.Game) {
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

      if (!card.processed && card.y > fieldHeight - DECISION_ZONE_HEIGHT) {
        card.processed = true;
        eventBus.emit('card:passed', card);
      }
    }

    timer.update(dt);
    hud.update();
  }

  // Обучение — карточки падают, проверяем decision zone
  if (currentMode === GameMode.Training) {
    const activeCards = cardPool.getActive();
    const fieldHeight = gameField.clientHeight;

    for (const card of activeCards) {
      card.y += card.speed * dt;
      card.element.style.transform = `translateY(${card.y}px)`;

      if (!card.processed && card.y > fieldHeight - DECISION_ZONE_HEIGHT) {
        card.processed = true;
        eventBus.emit('card:passed', card);
      }
    }
  }

  // Дуэль — аналогично классической игре
  if (currentMode === GameMode.DuelGame) {
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

      if (!card.processed && card.y > fieldHeight - DECISION_ZONE_HEIGHT) {
        card.processed = true;
        eventBus.emit('card:passed', card);
      }
    }

    timer.update(dt);
    hud.update();
  }
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
      trainingSummary.hide();
      trainingOverlay.hide(); // Скрыть overlay обучения без отправки события
      menuScreen.show();
      break;

    case GameMode.ClassicInit:
      // Скрыть все UI обучения
      trainingSummary.hide();
      trainingOverlay.hide();
      trainingIntro.hide();

      scoreManager.reset();
      timer.reset();
      hud.reset();
      isPaused = false;
      cardPool.getActive().forEach((c) => cardPool.release(c));
      stateMachine.transition(GameMode.Game);
      break;

    case GameMode.Game:
      menuScreen.hide();
      gameOverScreen.hide();
      hud.show();

      if (isPaused) {
        isPaused = false;
        timer.resume();
        inputSystem.init();
        pauseOverlay.hide();
        return;
      }

      inputSystem.init();
      timer.start(60);
      gameLoop.start();
      break;

    case GameMode.Paused:
      isPaused = true;
      timer.pause();
      pauseOverlay.show();
      break;

    case GameMode.GameOver: {
      gameLoop.stop();
      isPaused = false;
      timer.reset();
      inputSystem.destroy();
      hud.hide();

      const state = scoreManager.getState();
      const elapsed = Math.round(timer.getTotal() - timer.getRemaining());
      const result: GameResult = {
        score: state.score,
        accuracy: state.accuracy,
        time: elapsed,
        shield: state.shield,
      };

      // Сохраняем только результаты классической игры (score > 0)
      if (state.score > 0) {
        leaderboard.save({
          score: state.score,
          accuracy: state.accuracy,
          shield: state.shield,
          time: elapsed,
        });
      }

      gameOverScreen.show(result);
      break;
    }

    case GameMode.Training:
      menuScreen.hide();
      gameOverScreen.hide();
      hud.hide();
      gameLoop.start();
      trainingIntro.start(trainingScenario.getIntroSteps());
      break;

    case GameMode.Leaderboard:
      menuScreen.hide();
      gameOverScreen.hide();
      hud.hide();
      leaderboardScreen.show();
      break;

    case GameMode.DuelSetup:
      menuScreen.hide();
      gameOverScreen.hide();
      hud.hide();
      duelSetupScreen.show();
      break;

    case GameMode.DuelRoundStart: {
      const bestOf = (window as any).__duelBestOf || 3;
      if (duelManager.getState().currentRound === 1 && duelManager.getState().currentPlayer === 1) {
        duelManager.init(bestOf);
      }
      const state = duelManager.getState();
      duelRoundStartScreen.show(state.currentPlayer, state.currentRound, duelManager.getSeriesScore());
      break;
    }

    case GameMode.DuelGame: {
      const state = duelManager.getState();
      menuScreen.hide();
      gameOverScreen.hide();
      hud.show();
      hud.reset();
      inputSystem.init();
      scoreManager.reset();
      spawner.reset();
      cardPool.getActive().forEach((c) => cardPool.release(c));
      timer.start(60);
      gameLoop.start();
      break;
    }

    case GameMode.DuelCompare: {
      gameLoop.stop();
      inputSystem.destroy();
      hud.hide();
      const state = duelManager.getState();
      const result: DuelPlayerResult = {
        score: scoreManager.getState().score,
        accuracy: scoreManager.getState().accuracy,
        missedRisks: scoreManager.getMissedRisks(),
      };
      duelManager.recordResult(state.currentPlayer, result);

      if (state.currentPlayer === 2) {
        // Оба игрока сыграли — определить победителя раунда
        const p1 = duelManager.getState().roundResults.player1!;
        const p2 = duelManager.getState().roundResults.player2!;
        const winner = duelManager.determineWinner();
        if (winner !== 0) duelManager.recordWin(winner);

        gameLoop.stop();

        if (duelManager.isSeriesOver()) {
          const seriesScore = duelManager.getSeriesScore();
          const seriesWinner = seriesScore.p1 > seriesScore.p2 ? 1 : 2;
          duelWinnerScreen.show(seriesWinner, seriesScore);
          stateMachine.transition(GameMode.DuelWinner);
        } else {
          duelCompareScreen.show(p1, p2);
        }
      } else {
        // Игрок 1 закончил, переход к Игроку 2
        duelManager.nextRound();
        stateMachine.transition(GameMode.DuelRoundStart);
      }
      break;
    }

    case GameMode.DuelWinner:
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
  const mode = stateMachine.getCurrent();
  if (mode === GameMode.DuelGame) {
    // В дуэли — переход к сравнению результатов раунда
    stateMachine.transition(GameMode.DuelCompare);
  } else {
    // В классике — Game Over
    stateMachine.transition(GameMode.GameOver);
  }
});

eventBus.on('shield:changed', ({ value }) => {
  if (value <= 0) {
    stateMachine.transition(GameMode.GameOver);
  }
});

// === Кнопка паузы в HUD ===
eventBus.on('game:paused', () => {
  stateMachine.transition(GameMode.Paused);
});

// === Вспомогательные ===
function flashScreen(type: 'error' | 'success'): void {
  const flash = document.createElement('div');
  flash.className = type === 'error' ? 'error-flash' : 'success-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 400);
}

// === Обработка событий обучения ===
eventBus.on('training:intro:complete', () => {
  const practiceCards = trainingScenario.getPracticeCards();
  trainingOverlay.start(practiceCards);

  let practiceIndex = 0;
  const spawnPracticeCard = (visible = false) => {
    if (practiceIndex >= practiceCards.length) return;
    const data = practiceCards[practiceIndex];
    const card = cardPool.acquire(data);
    if (card) {
      card.speed = 60;
      // Первая карточка — сразу в видимой зоне, остальные — сверху
      card.y = visible ? 0 : -80;
      card.element.style.transform = `translateY(${card.y}px)`;
      card.element.style.left = `${30 + (practiceIndex % 5) * 10}%`;
      card.element.style.display = 'flex';
      card.element.className = `card card--${data.type} card--falling`;
      practiceIndex++;
    }
  };

  practiceInterval = setInterval(() => {
    if (practiceIndex < practiceCards.length) {
      spawnPracticeCard();
    } else {
      clearInterval(practiceInterval!);
      practiceInterval = null;
    }
  }, 3000);

  // Первая карточка — сразу в видимой зоне
  spawnPracticeCard(true);

  trainingClickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    const cardEl = target.closest('.card') as HTMLElement | null;
    if (!cardEl || !cardEl.dataset.cardId) return;
    const card = cardPool.findById(cardEl.dataset.cardId);
    if (!card || card.processed) return;
    card.processed = true;

    const isCorrect = card.type === 'risk';
    trainingOverlay.recordStep(
      { id: card.id, type: card.type, icon: card.type === 'risk' ? 'alert' : 'card', amount: 0, location: '', riskFactors: [] },
      isCorrect
    );

    if (isCorrect) {
      card.element.className = 'card card--blocked';
    } else {
      card.element.className = 'card card--error';
      flashScreen('error');
    }

    setTimeout(() => { cardPool.release(card); }, 500);
  };

  cardContainer.addEventListener('click', trainingClickHandler);

  // Обработка пропущенных карточек (ушли за decision zone без клика)
  const trainingPassHandler = (card: CardElement) => {
    if (!card.id.startsWith('p-')) return;

    // Пропуск нормы = правильно, пропуск риска = ошибка
    const isCorrect = card.type === 'norm';
    trainingOverlay.recordStep(
      { id: card.id, type: card.type, icon: card.type === 'risk' ? 'alert' : 'card', amount: 0, location: '', riskFactors: [] },
      isCorrect
    );
  };

  eventBus.on('card:passed', trainingPassHandler);
  (window as any).__trainingPassHandler = trainingPassHandler;
});

eventBus.on('training:complete', ({ correct, mistakes, patternStats }) => {
  // Очистка
  if (trainingClickHandler) {
    cardContainer.removeEventListener('click', trainingClickHandler);
    trainingClickHandler = null;
  }
  if (practiceInterval) {
    clearInterval(practiceInterval);
    practiceInterval = null;
  }
  eventBus.off('card:passed', (window as any).__trainingPassHandler);
  (window as any).__trainingPassHandler = null;

  gameLoop.stop();
  cardPool.getActive().forEach((c) => cardPool.release(c));
  gameOverScreen.hide(); // Гарантированно скрываем GameOver экран
  trainingSummary.show(correct, mistakes, patternStats);
});

// === Запуск — показываем главное меню
// GameStateMachine уже в состоянии Menu по умолчанию, просто показываем UI
menuScreen.show();

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
