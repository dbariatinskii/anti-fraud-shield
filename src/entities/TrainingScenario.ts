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
