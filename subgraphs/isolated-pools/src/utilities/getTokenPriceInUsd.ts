import { Address, BigDecimal } from '@graphprotocol/graph-ts';

import { PriceOracle } from '../../generated/templates/VToken/PriceOracle';
import { getPool } from '../operations/get';
import exponentToBigDecimal from '../utilities/exponentToBigDecimal';

// Used for all vBEP20 contracts
const getTokenPrice = (
  poolAddress: Address,
  eventAddress: Address,
  underlyingDecimals: i32,
): BigDecimal => {
  const pool = getPool(poolAddress);
  let underlyingPrice = BigDecimal.zero();
  if (pool && pool.priceOracle) {
    const oracleAddress = Address.fromBytes(pool.priceOracle);
    /* PriceOracle2 is used from starting of Comptroller.
     * This must use the vToken address.
     *
     * Note this returns the value without factoring in token decimals and wei, so we must divide
     * the number by (bnbDecimals - tokenDecimals) and again by the mantissa.
     */
    const mantissaDecimalFactor = exponentToBigDecimal(36 - underlyingDecimals);
    const priceOracle = PriceOracle.bind(oracleAddress);
    underlyingPrice = priceOracle
      .getUnderlyingPrice(eventAddress)
      .toBigDecimal()
      .div(mantissaDecimalFactor);
  }

  return underlyingPrice;
};

export default getTokenPrice;
