import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import { PriceOracle } from '../../generated/templates/VToken/PriceOracle';
import { getOrCreateComptroller } from '../operations/getOrCreate';
import { exponentToBigInt } from './exponentToBigInt';

// Used for all vBEP20 contracts
export function getTokenPriceCents(eventAddress: Address, underlyingDecimals: i32): BigInt {
  const comptroller = getOrCreateComptroller();
  if (!comptroller.priceOracle) {
    log.debug('[getTokenPrice] empty price oracle: {}', ['0']);
    return BigInt.zero();
  }
  const oracleAddress = Address.fromBytes(comptroller.priceOracle);

  /* PriceOracle2 is used from starting of Comptroller.
   * This must use the vToken address.
   *
   * Note this returns the value without factoring in token decimals and wei, so we must divide
   * the number by (bnbDecimals - tokenDecimals) and again by the mantissa.
   */
  const mantissaDecimalFactor = 36 - underlyingDecimals;
  const bdFactor = exponentToBigInt(mantissaDecimalFactor);
  const oracle2 = PriceOracle.bind(oracleAddress);
  const oracleUnderlyingPrice = oracle2.getUnderlyingPrice(eventAddress);
  if (oracleUnderlyingPrice.equals(BigInt.zero())) {
    return oracleUnderlyingPrice;
  }
  const underlyingPrice = oracleUnderlyingPrice.div(bdFactor);

  return underlyingPrice.times(BigInt.fromI32(100));
}
