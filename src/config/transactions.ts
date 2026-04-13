import { TransactionTemplate } from '@/types/config';

export const transactionTemplates: TransactionTemplate[] = [
  // === РИСК ===
  {
    icon: 'globe',
    type: 'risk',
    amountRange: [50_000, 500_000],
    locations: ['🌍 Overseas'],
    riskFactors: ['international', 'largeAmount'],
    label: 'Крупный международный перевод',
  },
  {
    icon: 'clock',
    type: 'risk',
    amountRange: [10_000, 100_000],
    locations: ['🌙 Night'],
    riskFactors: ['nightTime', 'unusualAmount'],
    label: 'Ночная подозрительная транзакция',
  },
  {
    icon: 'zap',
    type: 'risk',
    amountRange: [1_000, 20_000],
    locations: ['🔄 Multiple'],
    riskFactors: ['rapidSuccession', 'unusualLocation'],
    label: 'Серия быстрых транзакций',
  },
  {
    icon: 'alert',
    type: 'risk',
    amountRange: [100_000, 1_000_000],
    locations: ['⚠️ Unknown'],
    riskFactors: ['largeAmount', 'newMerchant'],
    label: 'Крупная оплата новому продавцу',
  },
  // === НОРМА ===
  {
    icon: 'card',
    type: 'norm',
    amountRange: [100, 5_000],
    locations: ['🏪 Local'],
    riskFactors: [],
    label: 'Обычная локальная покупка',
  },
  {
    icon: 'shopping',
    type: 'norm',
    amountRange: [500, 15_000],
    locations: ['🛒 Store'],
    riskFactors: [],
    label: 'Покупка в магазине',
  },
  {
    icon: 'phone',
    type: 'norm',
    amountRange: [50, 3_000],
    locations: ['📱 Online'],
    riskFactors: [],
    label: 'Онлайн-подписка',
  },
  {
    icon: 'home',
    type: 'norm',
    amountRange: [1_000, 10_000],
    locations: ['🏠 Home'],
    riskFactors: [],
    label: 'Коммунальный платёж',
  },
];
