/* eslint-disable prefer-const */
import { Address, log } from '@graphprotocol/graph-ts';

import { Comptroller as ComptrollerContract } from '../../generated/Comptroller/Comptroller';
import { Comptroller } from '../../generated/schema';
import { VToken } from '../../generated/templates';
import { updateMarket } from '../operations/update';

const comptrollerAddress = Address.fromString('0xfd36e2c2a6789db23113685031d7f16329158384');

export const ensureComptrollerSynced = (blockNumber: i32, blockTimestamp: i32): Comptroller => {
  let comptroller = Comptroller.load('1');
  if (comptroller) {
    return comptroller;
  }

  comptroller = new Comptroller('1');
  // If we want to start indexing from a block behind markets creation, we might have to
  // wait a very long time to get a market related event being triggered, before which we
  // can't get any market info, so here we manually fill up market info
  const comptrollerContract = ComptrollerContract.bind(comptrollerAddress);

  // init
  comptroller.priceOracle = comptrollerContract.oracle();
  comptroller.closeFactor = comptrollerContract.closeFactorMantissa();
  comptroller.liquidationIncentive = comptrollerContract.liquidationIncentiveMantissa();
  comptroller.maxAssets = comptrollerContract.maxAssets();

  log.debug(
    '[ensureComptrollerSynced] comptroller info completed, oracle: {} closeFactor: {} liquidationIncentive: {} maxAssets: {}',
    [
      comptroller.priceOracle.toHexString(),
      comptroller.closeFactor.toString(),
      comptroller.liquidationIncentive.toString(),
      comptroller.maxAssets.toString(),
    ],
  );

  comptroller.save();

  const allMarkets = comptrollerContract.getAllMarkets();

  log.debug('[ensureComptrollerSynced] all markets length: {}', [allMarkets.length.toString()]);

  for (let i = 0; i < allMarkets.length; i++) {
    updateMarket(allMarkets[i], blockNumber, blockTimestamp);
    VToken.create(allMarkets[i]);
  }

  return comptroller;
};
