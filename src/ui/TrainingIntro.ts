import { EventBus } from '@/core/EventBus';
import { DemoStep } from '@/config/training-scenarios';

export class TrainingIntro {
  private element!: HTMLElement;
  private container: HTMLElement;
  private currentStep = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private eventBus: EventBus, uiLayer: HTMLElement) {
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

    this.timer = setTimeout(() => {
      this.currentStep++;
      this.showStep(steps);
    }, 5000);
  }

  hide(): void {
    this.element.style.display = 'none';
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }
}
