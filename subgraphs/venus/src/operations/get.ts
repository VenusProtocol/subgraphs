import { Address, log } from '@graphprotocol/graph-ts';

import { Comptroller, Market } from '../../generated/schema';
import { comptrollerAddress } from '../constants/addresses';

export function getComptroller(): Comptroller {
  const comptroller = Comptroller.load(comptrollerAddress)!;
  return comptroller;
}

export const getMarket = (vTokenAddress: Address): Market | null => {
  const market = Market.load(vTokenAddress);
  if (!market) {
    log.error('Market {} not found', [vTokenAddress.toHexString()]);
  }
  return market;
};
