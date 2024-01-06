import { log } from '@graphprotocol/graph-ts';

import { Comptroller as ComptrollerContract } from '../../generated/Comptroller/Comptroller';
import { comptrollerAddress } from '../constants/addresses';
import { updateMarket } from '../operations/update';

export const ensureComptrollerSynced = (blockNumber: i32, blockTimestamp: i32): void => {
  const comptrollerContract = ComptrollerContract.bind(comptrollerAddress);

  // If we want to start indexing from a block behind markets creation, we might have to
  // wait a very long time to get a market related event being triggered, before which we
  // can't get any market info, so here we manually fill up market info

  const allMarkets = comptrollerContract.getAllMarkets();

  log.debug('[ensureComptrollerSynced] all markets length: {}', [allMarkets.length.toString()]);

  for (let i = 0; i < allMarkets.length; i++) {
    updateMarket(allMarkets[i].toHexString(), blockNumber, blockTimestamp);
  }
};
