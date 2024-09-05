import { Address } from '@graphprotocol/graph-ts';

import { Comptroller } from '../../generated/Comptroller/Comptroller';
import { VToken } from '../../generated/Comptroller/VToken';
import { Market } from '../../generated/schema';

export function updateXvsBorrowState(market: Market): void {
  const vTokenContract = VToken.bind(Address.fromBytes(market.id));
  const comptrollerAddress = vTokenContract.comptroller();
  const comptrollerContract = Comptroller.bind(comptrollerAddress);
  const marketState = comptrollerContract.venusBorrowState(Address.fromBytes(market.id));
  market.xvsBorrowStateIndex = marketState.getIndex();
  market.xvsBorrowStateBlock = marketState.getBlock();
  market.save();
}
