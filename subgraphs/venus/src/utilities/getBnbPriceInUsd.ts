import { Address, BigDecimal } from '@graphprotocol/graph-ts';

import { PriceOracle } from '../../generated/templates/VToken/PriceOracle';
import { vBnbAddress } from '../constants/addresses';
import { getOrCreateComptroller } from '../operations/getOrCreate';
import { mantissaFactorBD } from './exponentToBigDecimal';

export function getBnbPriceInUsd(): BigDecimal {
  const comptroller = getOrCreateComptroller();

  const oracleAddress = Address.fromBytes(comptroller.priceOracle);
  const oracle = PriceOracle.bind(oracleAddress);
  const bnbPriceInUSD = oracle.getUnderlyingPrice(vBnbAddress).toBigDecimal().div(mantissaFactorBD);
  return bnbPriceInUSD;
}
