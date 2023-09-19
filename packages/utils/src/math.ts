import BigNumber from 'bignumber.js';

export const normalizeMantissa = (num: number | string, decimals = 18): BigNumber => {
  return new BigNumber(num).div(new BigNumber(10).pow(decimals));
};

export const scaleValue = (num: number | string, decimals = 18): BigNumber => {
  return new BigNumber(num).times(new BigNumber(10).pow(decimals));
};
