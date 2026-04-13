/** Описание иконок для подсказок, тултипов и объяснения паттернов */
export interface IconInfo {
  /** Ключ иконки (совпадает с icon в TransactionTemplate) */
  key: string;
  /** Название иконки для отображения в UI */
  label: string;
  /** Описание значения иконки (для подсказок в обучении) */
  description: string;
  /** Факторы риска, связанные с этой иконкой */
  riskFactors: string[];
}

/** Реестр всех иконок в игре */
export const icons: Record<string, IconInfo> = {
  globe: {
    key: 'globe',
    label: 'Глобус',
    description: 'Международный перевод — деньги уходят за пределы страны. Всегда проверяй получателя.',
    riskFactors: ['international'],
  },
  clock: {
    key: 'clock',
    label: 'Часы',
    description: 'Ночная транзакция — подозрительная активность в нерабочее время. Может означать кражу данных карты.',
    riskFactors: ['nightTime'],
  },
  zap: {
    key: 'zap',
    label: 'Молния',
    description: 'Серия быстрых транзакций — мошенники часто дробят крупную сумму на мелкие платежи.',
    riskFactors: ['rapidSuccession'],
  },
  alert: {
    key: 'alert',
    label: 'Предупреждение',
    description: 'Крупная оплата новому продавцу — неизвестный получатель с большой суммой требует внимания.',
    riskFactors: ['newMerchant', 'largeAmount'],
  },
  card: {
    key: 'card',
    label: 'Банковская карта',
    description: 'Обычная оплата картой в знакомом месте — стандартная повседневная операция.',
    riskFactors: [],
  },
  shopping: {
    key: 'shopping',
    label: 'Покупка',
    description: 'Покупка в магазине — типичная легитимная транзакция.',
    riskFactors: [],
  },
  phone: {
    key: 'phone',
    label: 'Телефон',
    description: 'Онлайн-оплата или подписка через мобильное устройство — обычная цифровая операция.',
    riskFactors: [],
  },
  home: {
    key: 'home',
    label: 'Дом',
    description: 'Коммунальный или бытовой платёж — регулярная операция из дома.',
    riskFactors: [],
  },
};

/** Получить информацию об иконке по ключу */
export function getIconInfo(key: string): IconInfo {
  return icons[key] || {
    key,
    label: key,
    description: 'Неизвестный тип транзакции',
    riskFactors: [],
  };
}

/** Получить все факторы риска, связанные с набором иконок */
export function getRiskFactorsForIcons(iconKeys: string[]): string[] {
  const factors = new Set<string>();
  for (const key of iconKeys) {
    const info = icons[key];
    if (info) {
      info.riskFactors.forEach((f) => factors.add(f));
    }
  }
  return Array.from(factors);
}
