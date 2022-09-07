import BigNumber from 'bignumber.js';

export const normalizeMantissa = (num: number | string, scale = 1e18): BigNumber => {
  if (num < 0) return new BigNumber(2).pow(256).plus(num);
  return new BigNumber(num).times(scale);
};
