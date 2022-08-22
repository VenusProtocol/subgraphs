import { Address, BigDecimal } from '@graphprotocol/graph-ts';

import { PriceOracle } from '../../generated/templates/VToken/PriceOracle';
import { defaultMantissaFactorBigDecimal } from '../constants';
import { vBnbAddress } from '../constants/addresses';
import { readPool } from '../operations/read';

const getBnbPriceInUsd = (poolAddress: Address): BigDecimal => {
  const comptroller = readPool(poolAddress);

  const priceOracleAddress = Address.fromBytes(comptroller.priceOracle);
  const priceOracle = PriceOracle.bind(priceOracleAddress);
  const bnbPriceInUsd = priceOracle
    .getUnderlyingPrice(vBnbAddress)
    .toBigDecimal()
    .div(defaultMantissaFactorBigDecimal);
  return bnbPriceInUsd;
};

export default getBnbPriceInUsd;
