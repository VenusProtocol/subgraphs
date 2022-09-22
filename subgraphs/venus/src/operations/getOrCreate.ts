import { BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Comptroller as ComptrollerContract } from '../../generated/Comptroller/Comptroller';
import { Comptroller } from '../../generated/schema';
import { AccountVTokenTransaction } from '../../generated/schema';
import { comptrollerAddress } from '../constants/addresses';

export const getOrCreateComptroller = (): Comptroller => {
  let comptroller = Comptroller.load(comptrollerAddress.toHexString());
  if (comptroller) {
    return comptroller;
  }

  comptroller = new Comptroller(comptrollerAddress.toHexString());
  const comptrollerContract = ComptrollerContract.bind(comptrollerAddress);

  comptroller.priceOracle = comptrollerContract.oracle();
  comptroller.closeFactor = comptrollerContract.closeFactorMantissa();
  comptroller.liquidationIncentive = comptrollerContract.liquidationIncentiveMantissa();
  comptroller.maxAssets = comptrollerContract.maxAssets();

  comptroller.save();
  return comptroller;
};

export const getOrCreateAccountVTokenTransaction = (
  accountID: string,
  txHash: Bytes,
  timestamp: BigInt,
  block: BigInt,
  logIndex: BigInt,
): AccountVTokenTransaction => {
  const id = accountID
    .concat('-')
    .concat(txHash.toHexString())
    .concat('-')
    .concat(logIndex.toString());
  let transaction = AccountVTokenTransaction.load(id);

  if (transaction == null) {
    transaction = new AccountVTokenTransaction(id);
    transaction.account = accountID;
    transaction.tx_hash = txHash; // eslint-disable-line @typescript-eslint/camelcase
    transaction.timestamp = timestamp;
    transaction.block = block;
    transaction.logIndex = logIndex;
    transaction.save();
  }

  return transaction as AccountVTokenTransaction;
};
