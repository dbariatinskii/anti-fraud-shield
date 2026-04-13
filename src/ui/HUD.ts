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
        <button class="hud__pause-btn" id="hud-pause-btn" aria-label="Пауза">⏸</button>
      </div>
    `;

    this.shieldBar = this.element.querySelector('#shield-fill')!;
    this.scoreEl = this.element.querySelector('#hud-score')!;
    this.timerEl = this.element.querySelector('#hud-timer-text')!;
    this.timerCircle = this.element.querySelector('#hud-timer-progress')!;

    this.subscribe();

    // Кнопка паузы
    this.element.querySelector('#hud-pause-btn')?.addEventListener('click', () => {
      this.eventBus.emit('game:paused', undefined as void);
    });
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
    this.eventBus.on('shield:changed', ({ value }) => {
      const pct = value;
      this.shieldBar.style.width = `${pct}%`;

      if (pct > 50) {
        this.shieldBar.style.background = 'var(--color-safe)';
      } else if (pct > 20) {
        this.shieldBar.style.background = 'var(--color-warning)';
      } else {
        this.shieldBar.style.background = 'var(--color-risk)';
      }
    });

    this.eventBus.on('game:score', ({ points }) => {
      if (points > 0) {
        const current = parseInt(this.scoreEl.textContent || '0');
        this.scoreEl.textContent = `${current + points}`;
      }
    });

    this.eventBus.on('timer:tick', (remaining) => {
      this.timerEl.textContent = `${remaining}`;

      if (remaining <= 10) {
        this.timerEl.classList.add('pulse');
        this.timerCircle.style.stroke = 'var(--color-risk)';
      } else if (remaining <= 20) {
        this.timerCircle.style.stroke = 'var(--color-warning)';
      }
    });
  }

  /** Обновлять прогресс таймера каждый кадр */
  update(): void {
    const progress = this.timer.getProgress();
    const circumference = 100.53;
    const offset = circumference * (1 - progress);
    this.timerCircle.style.strokeDashoffset = `${offset}`;
  }
}
