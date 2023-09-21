import { Address, BigInt } from '@graphprotocol/graph-ts';

import { PriceOracle } from '../../generated/templates/VToken/PriceOracle';
import { NOT_AVAILABLE_BIG_INT } from '../constants';
import { getPool } from '../operations/get';
import exponentToBigInt from './exponentToBigInt';
import valueOrNotAvailableIntIfReverted from './valueOrNotAvailableIntIfReverted';

// Used for all vBEP20 contracts
const getTokenPriceInCents = (
  poolAddress: Address,
  eventAddress: Address,
  underlyingDecimals: i32,
): BigInt => {
  const pool = getPool(poolAddress);
  // will return NOT_AVAILABLE if the price cannot be fetched
  let underlyingPrice = NOT_AVAILABLE_BIG_INT;
  if (pool && pool.priceOracleAddress) {
    const oracleAddress = Address.fromBytes(pool.priceOracleAddress);
    /* PriceOracle2 is used from starting of Comptroller.
     * This must use the vToken address.
     *
     * Note this returns the value without factoring in token decimals and wei, so we must divide
     * the number by (bnbDecimals - tokenDecimals) and again by the mantissa.
     */
    const mantissaDecimalFactor = exponentToBigInt(36 - underlyingDecimals);
    const priceOracle = PriceOracle.bind(oracleAddress);

    const underlyingPriceBigInt = valueOrNotAvailableIntIfReverted(
      priceOracle.try_getUnderlyingPrice(eventAddress),
    );
    underlyingPrice = underlyingPriceBigInt.div(mantissaDecimalFactor);
  }

  return underlyingPrice;
};

export default getTokenPriceInCents;
