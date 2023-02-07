import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { VToken } from '../../generated/PoolRegistry/VToken';
import { VToken as VTokenContract } from '../../generated/PoolRegistry/VToken';
import {
  Account,
  AccountVToken,
  AccountVTokenTransaction,
  Market,
  Pool,
  RewardSpeed,
} from '../../generated/schema';
import { zeroBigDecimal, zeroBigInt32 } from '../constants';
import {
  getAccountVTokenId,
  getAccountVTokenTransactionId,
  getMarketId,
  getPoolId,
  getRewardSpeedId,
} from '../utilities/ids';
import { createAccount, createMarket, createPool } from './create';

export const getOrCreateMarket = (
  vTokenAddress: Address,
  comptrollerAddress: Address | null = null,
): Market => {
  let market = Market.load(getMarketId(vTokenAddress));
  if (!market) {
    const vTokenContract = VTokenContract.bind(vTokenAddress);
    if (!comptrollerAddress) {
      comptrollerAddress = vTokenContract.comptroller();
    }
    market = createMarket(comptrollerAddress, vTokenAddress);
  }
  return market;
};

export const getOrCreatePool = (comptroller: Address): Pool => {
  let pool = Pool.load(getPoolId(comptroller));
  if (!pool) {
    pool = createPool(comptroller);
  }
  return pool;
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
    transaction.txHash = txHash;
    transaction.timestamp = timestamp;
    transaction.block = block;
    transaction.logIndex = logIndex;
    transaction.save();
  }

  return transaction;
};

export const getOrCreateAccountVToken = (
  marketSymbol: string,
  accountAddress: Address,
  marketAddress: Address,
  enteredMarket: boolean = false, // eslint-disable-line @typescript-eslint/no-inferrable-types
): AccountVToken => {
  const accountVTokenId = getAccountVTokenId(marketAddress, accountAddress);
  let accountVToken = AccountVToken.load(accountVTokenId);
  if (!accountVToken) {
    accountVToken = new AccountVToken(accountVTokenId);
    accountVToken.symbol = marketSymbol;
    accountVToken.account = accountAddress.toHexString();
    accountVToken.market = marketAddress.toHexString();
    accountVToken.isCollateralOfUser = enteredMarket;
    accountVToken.accrualBlockNumber = zeroBigInt32;
    // we need to set an initial real onchain value to this otherwise it will never
    // be accurate
    const vTokenContract = VToken.bind(marketAddress);
    const accountSnapshot = vTokenContract.getAccountSnapshot(accountAddress);
    const suppliedAmountWei = accountSnapshot.value1;
    const borrowedAmountWei = accountSnapshot.value2;
    accountVToken.userSupplyBalanceWei = suppliedAmountWei;
    accountVToken.userBorrowBalanceWei = borrowedAmountWei;

    accountVToken.totalUnderlyingRedeemedWei = zeroBigDecimal;
    accountVToken.accountBorrowIndex = zeroBigDecimal;
    accountVToken.totalUnderlyingRepaidWei = zeroBigDecimal;
  }
  return accountVToken;
};

export const getOrCreateRewardSpeed = (
  rewardsDistributorAddress: Address,
  marketAddress: Address,
): RewardSpeed => {
  const id = getRewardSpeedId(rewardsDistributorAddress, marketAddress);
  let rewardSpeed = RewardSpeed.load(id);
  if (!rewardSpeed) {
    rewardSpeed = new RewardSpeed(id);
    rewardSpeed.rewardsDistributor = rewardsDistributorAddress.toHexString();
    rewardSpeed.market = marketAddress.toHexString();
    rewardSpeed.borrowSpeedPerBlockWei = zeroBigInt32;
    rewardSpeed.supplySpeedPerBlockWei = zeroBigInt32;
    rewardSpeed.save();
  }
  return rewardSpeed;
};
