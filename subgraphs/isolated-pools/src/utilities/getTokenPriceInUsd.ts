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
  if (pool && pool.priceOracleAddress) {
    const oracleAddress = Address.fromBytes(pool.priceOracleAddress);
    /* PriceOracle2 is used from starting of Comptroller.
     * This must use the vToken address.
     *
     * Note this returns the value without factoring in token decimals and wei, so we must divide
     * the number by (bnbDecimals - tokenDecimals) and again by the mantissa.
     */
    const mantissaDecimalFactor = exponentToBigDecimal(36 - underlyingDecimals);
    const priceOracle = PriceOracle.bind(oracleAddress);
    // Calling getUnderlyingPrice might revert if the pyth price pusher is unfunded
    // On revert we will return 0
    const underlyingPriceResult = priceOracle.try_getUnderlyingPrice(eventAddress);
    if (!underlyingPriceResult.reverted) {
      underlyingPrice = underlyingPriceResult.value.toBigDecimal().div(mantissaDecimalFactor);
    }
  }

  return underlyingPrice;
};

export default getTokenPrice;
