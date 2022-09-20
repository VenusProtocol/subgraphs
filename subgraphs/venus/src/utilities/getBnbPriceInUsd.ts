import { Address, BigDecimal } from '@graphprotocol/graph-ts';

import { Comptroller } from '../../generated/schema';
import { PriceOracle2 } from '../../generated/templates/VToken/PriceOracle2';
import { vBnbAddress } from '../constants/addresses';
import { mantissaFactorBD } from './exponentToBigDecimal';

export function getBnbPriceInUsd(): BigDecimal {
  let comptroller = Comptroller.load('1');
  if (!comptroller) {
    comptroller = new Comptroller('1');
  }

  const oracleAddress = Address.fromBytes(comptroller.priceOracle);
  const oracle = PriceOracle2.bind(oracleAddress);
  const bnbPriceInUSD = oracle
    .getUnderlyingPrice(vBnbAddress)
    .toBigDecimal()
    .div(mantissaFactorBD);
  return bnbPriceInUSD;
}
