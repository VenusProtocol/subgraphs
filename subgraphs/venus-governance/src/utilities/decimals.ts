import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const DEFAULT_DECIMALS = 18 as u8;

export function pow(base: BigDecimal, exponent: number): BigDecimal {
  let result = base;

  if (exponent == 0) {
    return BigDecimal.fromString('1');
  }

  for (let i = 2; i <= exponent; i++) {
    result = result.times(base);
  }

  return result;
}

export function toDecimal(value: BigInt, decimals: u8 = DEFAULT_DECIMALS): BigDecimal {
  const precision = BigInt.fromI32(10).pow(decimals).toBigDecimal();
  return value.divDecimal(precision);
}
