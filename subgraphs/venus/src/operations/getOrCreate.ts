import { BigInt, Bytes } from '@graphprotocol/graph-ts';

import { AccountVTokenTransaction } from '../../generated/schema';

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
