import { CardData } from '@/types/game';

/** Шаг автодемо: карточка + ожидаемое действие + объяснение */
export interface DemoStep {
  card: CardData;
  action: 'block' | 'pass';
  explanation: string;
}

/** Фиксированные шаги автодемо (3 примера) */
export const demoSteps: DemoStep[] = [
  {
    card: {
      id: 'demo-1',
      type: 'risk',
      icon: 'globe',
      amount: 250_000,
      location: '🌍 За рубежом',
      riskFactors: ['international', 'largeAmount'],
    },
    action: 'block',
    explanation: 'Крупный международный перевод — высокий риск мошенничества',
  },
  {
    card: {
      id: 'demo-2',
      type: 'norm',
      icon: 'card',
      amount: 2_500,
      location: '🏪 Местный магазин',
      riskFactors: [],
    },
    action: 'pass',
    explanation: 'Обычная локальная покупка — легитимная транзакция',
  },
  {
    card: {
      id: 'demo-3',
      type: 'norm',
      icon: 'shopping',
      amount: 8_000,
      location: '🛒 Супермаркет',
      riskFactors: [],
    },
    action: 'pass',
    explanation: 'Покупка в магазине — если заблокировать, потеряете очки',
  },
];

/** 20 фиксированных карточек для практики (покрытие всех паттернов) */
export const practiceCards: CardData[] = [
  // Риск (10 карточек)
  { id: 'p-1', type: 'risk', icon: 'globe', amount: 150_000, location: '🌍 За рубежом', riskFactors: ['international'] },
  { id: 'p-2', type: 'risk', icon: 'clock', amount: 45_000, location: '🌙 Ночью', riskFactors: ['nightTime'] },
  { id: 'p-3', type: 'risk', icon: 'zap', amount: 5_000, location: '🔄 Несколько подряд', riskFactors: ['rapidSuccession'] },
  { id: 'p-4', type: 'risk', icon: 'alert', amount: 500_000, location: '⚠️ Неизвестный', riskFactors: ['newMerchant'] },
  { id: 'p-5', type: 'risk', icon: 'globe', amount: 320_000, location: '🌍 За рубежом', riskFactors: ['international'] },
  { id: 'p-6', type: 'risk', icon: 'clock', amount: 78_000, location: '🌙 Ночью', riskFactors: ['nightTime'] },
  { id: 'p-7', type: 'risk', icon: 'zap', amount: 12_000, location: '🔄 Несколько подряд', riskFactors: ['rapidSuccession'] },
  { id: 'p-8', type: 'risk', icon: 'alert', amount: 800_000, location: '⚠️ Неизвестный', riskFactors: ['newMerchant'] },
  { id: 'p-9', type: 'risk', icon: 'globe', amount: 95_000, location: '🌍 За рубежом', riskFactors: ['international'] },
  { id: 'p-10', type: 'risk', icon: 'clock', amount: 33_000, location: '🌙 Ночью', riskFactors: ['nightTime'] },
  // Норма (10 карточек)
  { id: 'p-11', type: 'norm', icon: 'card', amount: 1_200, location: '🏪 Местный магазин', riskFactors: [] },
  { id: 'p-12', type: 'norm', icon: 'shopping', amount: 4_500, location: '🛒 Супермаркет', riskFactors: [] },
  { id: 'p-13', type: 'norm', icon: 'phone', amount: 299, location: '📱 Онлайн-сервис', riskFactors: [] },
  { id: 'p-14', type: 'norm', icon: 'home', amount: 3_200, location: '🏠 Коммунальные', riskFactors: [] },
  { id: 'p-15', type: 'norm', icon: 'card', amount: 800, location: '🏪 Местный магазин', riskFactors: [] },
  { id: 'p-16', type: 'norm', icon: 'shopping', amount: 7_800, location: '🛒 Супермаркет', riskFactors: [] },
  { id: 'p-17', type: 'norm', icon: 'phone', amount: 199, location: '📱 Онлайн-сервис', riskFactors: [] },
  { id: 'p-18', type: 'norm', icon: 'home', amount: 5_400, location: '🏠 Коммунальные', riskFactors: [] },
  { id: 'p-19', type: 'norm', icon: 'card', amount: 2_100, location: '🏪 Местный магазин', riskFactors: [] },
  { id: 'p-20', type: 'norm', icon: 'shopping', amount: 11_000, location: '🛒 Супермаркет', riskFactors: [] },
];
