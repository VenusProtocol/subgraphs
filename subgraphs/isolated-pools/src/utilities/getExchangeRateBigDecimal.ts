import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

import { defaultMantissaFactorBigDecimal, mantissaFactor } from '../constants/index';
import exponentToBigDecimal from '../utilities/exponentToBigDecimal';

const getExchangeRateBigDecimal = (exchangeRateMantissa: BigInt, underlyingDecimals: i32, vTokenDecimals: i32): BigDecimal => {
  /* Exchange rate explanation
    In Practice
    - If you call the vDAI contract on bscscan it comes back (2.0 * 10^26)
    - If you call the vUSDC contract on bscscan it comes back (2.0 * 10^14)
    - The real value is ~0.02. So vDAI is off by 10^28, and vUSDC 10^16
    How to calculate for tokens with different decimals
    - Must div by tokenDecimals, 10^market.underlyingDecimals
    - Must multiply by vtokenDecimals, 10^8
    - Must div by mantissa, 10^18
  */
  const exchangeRate = exchangeRateMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .times(exponentToBigDecimal(vTokenDecimals))
    .div(defaultMantissaFactorBigDecimal)
    .truncate(mantissaFactor);

  return exchangeRate;
};

export default getExchangeRateBigDecimal;
