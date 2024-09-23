import { Address } from '@graphprotocol/graph-ts';

import { Comptroller } from '../../generated/Comptroller/Comptroller';
import { Market } from '../../generated/schema';
import { comptrollerAddress } from '../constants/addresses';

export function updateXvsBorrowState(market: Market): void {
  const comptrollerContract = Comptroller.bind(comptrollerAddress);
  const marketState = comptrollerContract.venusBorrowState(Address.fromBytes(market.id));
  market.xvsBorrowStateIndex = marketState.getIndex();
  market.xvsBorrowStateBlock = marketState.getBlock();
  market.save();
}
