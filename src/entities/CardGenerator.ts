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
