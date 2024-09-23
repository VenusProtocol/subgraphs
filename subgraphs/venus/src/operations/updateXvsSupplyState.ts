import { Address } from '@graphprotocol/graph-ts';

import { Comptroller } from '../../generated/Comptroller/Comptroller';
import { Market } from '../../generated/schema';
import { comptrollerAddress } from '../constants/addresses';

export function updateXvsSupplyState(market: Market): void {
  const comptrollerContract = Comptroller.bind(comptrollerAddress);
  const marketState = comptrollerContract.venusSupplyState(Address.fromBytes(market.id));
  market.xvsSupplyStateIndex = marketState.getIndex();
  market.xvsSupplyStateBlock = marketState.getBlock();
  market.save();
}
