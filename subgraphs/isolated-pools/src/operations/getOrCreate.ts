import { Address, BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { BEP20 } from '../../generated/PoolRegistry/BEP20';
import {
  Account,
  AccountVToken,
  AccountVTokenTransaction,
  Market,
  Pool,
} from '../../generated/schema';
import { zeroBigDecimal } from '../constants';
import { getAccountVTokenTransactionId } from '../utilities/ids';
import { createAccount, createMarket, createPool } from './create';

export const getOrCreatePool = (poolAddress: Address): Pool => {
  let pool = Pool.load(poolAddress.toHexString());
  if (!pool) {
    pool = createPool(poolAddress);
  }
  return pool;
};

export const getOrCreateMarket = (cTokenAddress: Address): Market => {
  let market = Market.load(cTokenAddress.toHexString());
  if (!market) {
    market = createMarket(cTokenAddress);
  }
  return market;
};

export const getOrCreateAccount = (accountAddress: Address): Account => {
  let account = Account.load(accountAddress.toHexString());
  if (!account) {
    account = createAccount(accountAddress);
  }
  return account;
};

export const getOrCreateAccountVTokenTransaction = (
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  block: BigInt,
  logIndex: BigInt,
): AccountVTokenTransaction => {
  const accountVTokenTransactionId = getAccountVTokenTransactionId(
    accountAddress,
    txHash,
    logIndex,
  );
  let transaction = AccountVTokenTransaction.load(accountVTokenTransactionId.toString());

  if (transaction == null) {
    transaction = new AccountVTokenTransaction(accountVTokenTransactionId);
    transaction.account = accountAddress.toHexString();
    transaction.tx_hash = txHash; // eslint-disable-line @typescript-eslint/camelcase
    transaction.timestamp = timestamp;
    transaction.block = block;
    transaction.logIndex = logIndex;
    transaction.save();
  }

  return transaction;
};

export const getOrCreateAccountVToken = (
  accountVTokenId: string,
  marketSymbol: string,
  accountAddress: Address,
  marketAddress: Address,
  enteredMarket: boolean,
): AccountVToken => {
  let accountVToken = AccountVToken.load(accountVTokenId);
  if (!accountVToken) {
    accountVToken = new AccountVToken(accountVTokenId);
    accountVToken.symbol = marketSymbol;
    accountVToken.account = accountAddress.toHexString();
    accountVToken.market = marketAddress.toHexString();
    accountVToken.enteredMarket = enteredMarket;
    accountVToken.accrualBlockNumber = BigInt.fromI32(0);
    // we need to set an initial real onchain value to this otherwise it will never
    // be accurate
    const vTokenContract = BEP20.bind(marketAddress);
    accountVToken.vTokenBalance = new BigDecimal(vTokenContract.balanceOf(accountAddress));

    accountVToken.totalUnderlyingSupplied = zeroBigDecimal;
    accountVToken.totalUnderlyingRedeemed = zeroBigDecimal;
    accountVToken.accountBorrowIndex = zeroBigDecimal;
    accountVToken.totalUnderlyingBorrowed = zeroBigDecimal;
    accountVToken.totalUnderlyingRepaid = zeroBigDecimal;
    accountVToken.storedBorrowBalance = zeroBigDecimal;
  }
  return accountVToken;
};
