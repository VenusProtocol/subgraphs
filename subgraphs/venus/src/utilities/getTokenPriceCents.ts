import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import { valueOrNotAvailableIntIfReverted } from '.';
import { PriceOracle } from '../../generated/templates/VToken/PriceOracle';
import { getComptroller } from '../operations/get';
import { exponentToBigInt } from './exponentToBigInt';

// Used for all vBEP20 contracts
export function getTokenPriceCents(eventAddress: Address, underlyingDecimals: i32): BigInt {
  const comptroller = getComptroller();
  if (!comptroller.priceOracle) {
    log.debug('[getTokenPrice] empty price oracle: {}', ['0']);
    return BigInt.zero();
  }
  const oracleAddress = Address.fromBytes(comptroller.priceOracle);

  /* PriceOracle is used from starting of Comptroller.
   * This must use the vToken address.
   *
   * Note this returns the value without factoring in token decimals and wei, so we must divide
   * the number by (bnbDecimals - tokenDecimals) and again by the mantissa.
   */
  const mantissaDecimalFactor = 36 - underlyingDecimals - 2;
  const bdFactor = exponentToBigInt(mantissaDecimalFactor);
  const oracle = PriceOracle.bind(oracleAddress);
  const oracleUnderlyingPrice = valueOrNotAvailableIntIfReverted(
    oracle.try_getUnderlyingPrice(eventAddress),
    'PriceOracle try_getUnderlyingPrice',
  );
  if (oracleUnderlyingPrice.equals(BigInt.zero())) {
    return oracleUnderlyingPrice;
  }
  const underlyingPrice = oracleUnderlyingPrice.div(bdFactor);

  return underlyingPrice;
}
