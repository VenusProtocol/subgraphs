import { Address, BigInt } from '@graphprotocol/graph-ts';

import { VToken as VTokenContract } from '../../generated/PoolRegistry/VToken';
import {
  Account,
  AccountPool,
  AccountVToken,
  Market,
  Pool,
  RewardSpeed,
  RewardsDistributor,
} from '../../generated/schema';
import { VToken as VTokenDataSource } from '../../generated/templates';
import { Comptroller } from '../../generated/templates/Pool/Comptroller';
import { RewardsDistributor as RewardDistributorContract } from '../../generated/templates/RewardsDistributor/RewardsDistributor';
import { zeroBigInt32 } from '../constants';
import {
  getAccountPoolId,
  getAccountVTokenId,
  getMarketId,
  getPoolId,
  getRewardSpeedId,
  getRewardsDistributorId,
} from '../utilities/ids';
import { createAccount, createAccountPool, createMarket, createPool } from './create';
import { getAccountVToken } from './get';

export const getOrCreateMarket = (
  vTokenAddress: Address,
  comptrollerAddress: Address,
  blockNumber: BigInt,
): Market => {
  let market = Market.load(getMarketId(vTokenAddress));
  if (!market) {
    VTokenDataSource.create(vTokenAddress);
    market = createMarket(comptrollerAddress, vTokenAddress, blockNumber);
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
  let account = Account.load(accountAddress);
  if (!account) {
    account = createAccount(accountAddress);
  }
  return account;
};

export const getOrCreateAccountPool = (
  accountAddress: Address,
  poolAddress: Address,
): AccountPool => {
  const accountPoolId = getAccountPoolId(accountAddress, poolAddress);
  let accountPool = AccountPool.load(accountPoolId);
  if (!accountPool) {
    accountPool = createAccountPool(accountAddress, poolAddress);
  }
  return accountPool;
};

export class GetOrCreateAccountVTokenReturn {
  entity: AccountVToken;
  created: boolean;
}

export const getOrCreateAccountVToken = (
  accountAddress: Address,
  poolAddress: Address,
  marketAddress: Address,
  enteredMarket: boolean = false, // eslint-disable-line @typescript-eslint/no-inferrable-types
): GetOrCreateAccountVTokenReturn => {
  let accountVToken = getAccountVToken(marketAddress, accountAddress);
  let created = false;
  if (!accountVToken) {
    created = true;
    const accountVTokenId = getAccountVTokenId(marketAddress, accountAddress);
    accountVToken = new AccountVToken(accountVTokenId);
    accountVToken.account = accountAddress;
    accountVToken.accountPool = getOrCreateAccountPool(accountAddress, poolAddress).id;
    accountVToken.market = marketAddress;
    accountVToken.enteredMarket = enteredMarket;
    accountVToken.accrualBlockNumber = zeroBigInt32;

    const vTokenContract = VTokenContract.bind(marketAddress);

    accountVToken.vTokenBalanceMantissa = zeroBigInt32;
    accountVToken.storedBorrowBalanceMantissa = zeroBigInt32;
    accountVToken.borrowIndex = vTokenContract.borrowIndex();

    accountVToken.totalUnderlyingRedeemedMantissa = zeroBigInt32;
    accountVToken.totalUnderlyingRepaidMantissa = zeroBigInt32;
    accountVToken.enteredMarket = false;
    accountVToken.save();
  }
  return { entity: accountVToken, created };
};

export const getOrCreateRewardSpeed = (
  rewardsDistributorAddress: Address,
  marketAddress: Address,
): RewardSpeed => {
  const id = getRewardSpeedId(rewardsDistributorAddress, marketAddress);
  let rewardSpeed = RewardSpeed.load(id);
  if (!rewardSpeed) {
    rewardSpeed = new RewardSpeed(id);
    rewardSpeed.rewardsDistributor = rewardsDistributorAddress;
    rewardSpeed.market = marketAddress;
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
    const rewardToken = rewardDistributorContract.rewardToken();
    rewardsDistributor = new RewardsDistributor(id);
    rewardsDistributor.pool = comptrollerAddress;
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
