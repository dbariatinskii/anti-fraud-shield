import { TransactionTemplate } from '@/types/config';

/** Шаблоны транзакций для генерации */
export const transactionTemplates: TransactionTemplate[] = [
  // === РИСК ===
  {
    icon: 'globe',
    type: 'risk',
    amountRange: [50_000, 500_000],
    locations: ['🌍 За рубежом'],
    riskFactors: ['international', 'largeAmount'],
    label: 'Крупный международный перевод',
  },
  {
    icon: 'clock',
    type: 'risk',
    amountRange: [10_000, 100_000],
    locations: ['🌙 Ночью'],
    riskFactors: ['nightTime', 'unusualAmount'],
    label: 'Ночная подозрительная транзакция',
  },
  {
    icon: 'zap',
    type: 'risk',
    amountRange: [1_000, 20_000],
    locations: ['🔄 Несколько подряд'],
    riskFactors: ['rapidSuccession', 'unusualLocation'],
    label: 'Серия быстрых транзакций',
  },
  {
    icon: 'alert',
    type: 'risk',
    amountRange: [100_000, 1_000_000],
    locations: ['⚠️ Неизвестный получатель'],
    riskFactors: ['largeAmount', 'newMerchant'],
    label: 'Крупная оплата новому продавцу',
  },
  // === НОРМА ===
  {
    icon: 'card',
    type: 'norm',
    amountRange: [100, 5_000],
    locations: ['🏪 Местный магазин'],
    riskFactors: [],
    label: 'Обычная локальная покупка',
  },
  {
    icon: 'shopping',
    type: 'norm',
    amountRange: [500, 15_000],
    locations: ['🛒 Супермаркет'],
    riskFactors: [],
    label: 'Покупка в магазине',
  },
  {
    icon: 'phone',
    type: 'norm',
    amountRange: [50, 3_000],
    locations: ['📱 Онлайн-сервис'],
    riskFactors: [],
    label: 'Онлайн-подписка',
  },
  {
    icon: 'home',
    type: 'norm',
    amountRange: [1_000, 10_000],
    locations: ['🏠 Коммунальные'],
    riskFactors: [],
    label: 'Коммунальный платёж',
  },
];
