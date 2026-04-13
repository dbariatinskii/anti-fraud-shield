/** Шаблон транзакции */
export interface TransactionTemplate {
  /** Иконка (CSS class postfix) */
  icon: string;
  /** Тип транзакции */
  type: 'risk' | 'norm';
  /** Диапазон суммы [min, max] */
  amountRange: [number, number];
  /** Возможные локации */
  locations: string[];
  /** Факторы риска */
  riskFactors: string[];
  /** Метка для подсказок */
  label: string;
}
