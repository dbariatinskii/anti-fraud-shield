/** RNG-хелпер */
export const rng = {
  /** Случайный элемент массива */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /** Случайное число в диапазоне [min, max] */
  range(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /** Вероятность (0..100) */
  chance(percent: number): boolean {
    return Math.random() * 100 < percent;
  },
};
