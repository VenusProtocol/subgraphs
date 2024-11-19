import { Address, BigInt } from '@graphprotocol/graph-ts';

import { PriceOracle } from '../../generated/templates/VToken/PriceOracle';
import { NOT_AVAILABLE_BIG_INT } from '../constants';
import { getPool } from '../operations/get';
import exponentToBigInt from './exponentToBigInt';
import valueOrNotAvailableIntIfReverted from './valueOrNotAvailableIntIfReverted';

// Used for all vBEP20 contracts
const getTokenPriceInCents = (
  poolAddress: Address,
  tokenAddress: Address,
  underlyingDecimals: i32,
): BigInt => {
  const pool = getPool(poolAddress);
  // will return NOT_AVAILABLE if the price cannot be fetched
  let underlyingPrice = NOT_AVAILABLE_BIG_INT;
  if (pool && pool.priceOracleAddress) {
    const oracleAddress = Address.fromBytes(pool.priceOracleAddress);
    const mantissaDecimalFactor = 36 - underlyingDecimals - 2;
    const bdFactor = exponentToBigInt(mantissaDecimalFactor);
    const priceOracle = PriceOracle.bind(oracleAddress);

    const oracleUnderlyingPrice = valueOrNotAvailableIntIfReverted(
      priceOracle.try_getUnderlyingPrice(tokenAddress),
    );
    if (oracleUnderlyingPrice.equals(BigInt.zero())) {
      return oracleUnderlyingPrice;
    }
    underlyingPrice = oracleUnderlyingPrice.div(bdFactor);
    underlyingPrice;
  }
  return underlyingPrice;
};

export default getTokenPriceInCents;
