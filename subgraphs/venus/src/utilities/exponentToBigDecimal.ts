/* eslint-disable prefer-const */
import { BigDecimal } from '@graphprotocol/graph-ts';

// Writting this as an arrow function, produces a type signature compile error
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1');
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString('10'));
  }
  return bd;
}

export let mantissaFactor = 18;
export let vTokenDecimals = 8;
export let mantissaFactorBD: BigDecimal = exponentToBigDecimal(mantissaFactor);
export let vTokenDecimalsBD: BigDecimal = exponentToBigDecimal(vTokenDecimals);
export let zeroBD = BigDecimal.fromString('0');
