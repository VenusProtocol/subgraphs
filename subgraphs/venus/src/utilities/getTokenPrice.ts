import { Address, BigDecimal } from '@graphprotocol/graph-ts';

import { Comptroller } from '../../generated/schema';
import { PriceOracle2 } from '../../generated/templates/VToken/PriceOracle2';
import { exponentToBigDecimal } from './exponentToBigDecimal';

// Used for all vBEP20 contracts
export function getTokenPrice(eventAddress: Address, underlyingDecimals: i32): BigDecimal {
  let comptroller = Comptroller.load('1');
  if (!comptroller) {
    comptroller = new Comptroller('1');
  }
  if (!comptroller.priceOracle) {
    // log.debug('[getTokenPrice] empty price oracle: {}', ['0']);
    return BigDecimal.zero();
  }
  const oracleAddress = Address.fromBytes(comptroller.priceOracle);

  /* PriceOracle2 is used from starting of Comptroller.
   * This must use the vToken address.
   *
   * Note this returns the value without factoring in token decimals and wei, so we must divide
   * the number by (bnbDecimals - tokenDecimals) and again by the mantissa.
   */
  const mantissaDecimalFactor = 18 - underlyingDecimals + 18;
  const bdFactor = exponentToBigDecimal(mantissaDecimalFactor);
  const oracle2 = PriceOracle2.bind(oracleAddress);
  const oracleUnderlyingPrice = oracle2.getUnderlyingPrice(eventAddress).toBigDecimal();
  if (oracleUnderlyingPrice.equals(BigDecimal.zero())) {
    return oracleUnderlyingPrice;
  }
  const underlyingPrice = oracleUnderlyingPrice.div(bdFactor);

  return underlyingPrice;
}
