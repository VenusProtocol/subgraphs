import { Address, BigInt } from '@graphprotocol/graph-ts';

import { VToken } from '../../generated/PoolRegistry/VToken';
import { VToken as VTokenContract } from '../../generated/PoolRegistry/VToken';
import {
  Account,
  AccountVToken,
  Market,
  Pool,
  RewardSpeed,
  RewardsDistributor,
} from '../../generated/schema';
import { Comptroller } from '../../generated/templates/Pool/Comptroller';
import { RewardsDistributor as RewardDistributorContract } from '../../generated/templates/RewardsDistributor/RewardsDistributor';
import { zeroBigInt32 } from '../constants';
import {
  getAccountVTokenId,
  getMarketId,
  getPoolId,
  getRewardSpeedId,
  getRewardsDistributorId,
} from '../utilities/ids';
import { createAccount, createMarket, createPool } from './create';

export const getOrCreateMarket = (
  vTokenAddress: Address,
  comptrollerAddress: Address | null = null,
  blockTimestamp: BigInt = BigInt.fromI32(0),
): Market => {
  let market = Market.load(getMarketId(vTokenAddress));
  if (!market) {
    const vTokenContract = VTokenContract.bind(vTokenAddress);
    if (!comptrollerAddress) {
      comptrollerAddress = vTokenContract.comptroller();
    }
    market = createMarket(comptrollerAddress, vTokenAddress, blockTimestamp);
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

export const getOrCreateAccountVToken = (
  accountAddress: Address,
  marketAddress: Address,
  enteredMarket: boolean = false, // eslint-disable-line @typescript-eslint/no-inferrable-types
): AccountVToken => {
  const accountVTokenId = getAccountVTokenId(marketAddress, accountAddress);
  let accountVToken = AccountVToken.load(accountVTokenId);
  if (!accountVToken) {
    accountVToken = new AccountVToken(accountVTokenId);
    accountVToken.account = accountAddress.toHexString();
    accountVToken.market = marketAddress.toHexString();
    accountVToken.enteredMarket = enteredMarket;
    accountVToken.accrualBlockNumber = zeroBigInt32;
    // we need to set an initial real onchain value to this otherwise it will never
    // be accurate
    const vTokenContract = VToken.bind(marketAddress);
    const accountSnapshot = vTokenContract.getAccountSnapshot(accountAddress);

    const suppliedAmountMantissa = accountSnapshot.value1;
    const borrowedAmountMantissa = accountSnapshot.value2;
    accountVToken.accountSupplyBalanceMantissa = suppliedAmountMantissa;
    accountVToken.accountBorrowBalanceMantissa = borrowedAmountMantissa;

    accountVToken.totalUnderlyingRedeemedMantissa = zeroBigInt32;
    accountVToken.accountBorrowIndexMantissa = zeroBigInt32;
    accountVToken.totalUnderlyingRepaidMantissa = zeroBigInt32;
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
    rewardSpeed.borrowSpeedPerBlockMantissa = zeroBigInt32;
    rewardSpeed.supplySpeedPerBlockMantissa = zeroBigInt32;
    rewardSpeed.save();
  }
  return rewardSpeed;
};

export const getOrCreateRewardDistributor = (
  rewardsDistributorAddress: Address,
  comptrollerAddress: Address,
): RewardsDistributor => {
  const id = getRewardsDistributorId(rewardsDistributorAddress);
  let rewardsDistributor = RewardsDistributor.load(id);

  if (!rewardsDistributor) {
    const rewardDistributorContract = RewardDistributorContract.bind(rewardsDistributorAddress);
    const poolAddress = comptrollerAddress.toHexString();
    const rewardToken = rewardDistributorContract.rewardToken();
    rewardsDistributor = new RewardsDistributor(id);
    rewardsDistributor.pool = poolAddress;
    rewardsDistributor.reward = rewardToken;
    rewardsDistributor.save();

    // we get the current speeds for all known markets at this point in time
    const comptroller = Comptroller.bind(comptrollerAddress);
    const marketAddresses = comptroller.getAllMarkets();

    if (marketAddresses !== null) {
      for (let i = 0; i < marketAddresses.length; i++) {
        const marketAddress = marketAddresses[i];

        const rewardSpeed = getOrCreateRewardSpeed(rewardsDistributorAddress, marketAddress);
        rewardSpeed.borrowSpeedPerBlockMantissa =
          rewardDistributorContract.rewardTokenBorrowSpeeds(marketAddress);
        rewardSpeed.supplySpeedPerBlockMantissa =
          rewardDistributorContract.rewardTokenSupplySpeeds(marketAddress);
        rewardSpeed.save();
      }
    }
  }

  return rewardsDistributor;
};
