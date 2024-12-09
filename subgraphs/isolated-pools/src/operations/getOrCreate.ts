import { Address, BigInt } from '@graphprotocol/graph-ts';

import { VToken as VTokenContract } from '../../generated/PoolRegistry/VToken';
import {
  Account,
  AccountPool,
  MarketPosition,
  Market,
  Pool,
  RewardSpeed,
  RewardsDistributor,
} from '../../generated/schema';
import { zeroBigInt32 } from '../constants';
import {
  getAccountPoolId,
  getMarketPositionId,
  getPoolId,
  getRewardSpeedId,
  getRewardsDistributorId,
} from '../utilities/ids';
import {
  createAccount,
  createAccountPool,
  createMarket,
  createPool,
  createRewardDistributor,
} from './create';
import { getMarketPosition, getMarket } from './get';

export const getOrCreateMarket = (
  vTokenAddress: Address,
  comptrollerAddress: Address,
  blockNumber: BigInt,
): Market => {
  let market = getMarket(vTokenAddress);
  if (!market) {
    market = createMarket(vTokenAddress, comptrollerAddress, blockNumber);
  }
  return market as Market;
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

export class GetOrCreateMarketPositionReturn {
  entity: MarketPosition;
  created: boolean;
}

export const getOrCreateMarketPosition = (
  accountAddress: Address,
  marketAddress: Address,
  poolAddress: Address,
  enteredMarket: boolean = false, // eslint-disable-line @typescript-eslint/no-inferrable-types
): GetOrCreateMarketPositionReturn => {
  let marketPosition = getMarketPosition(accountAddress, marketAddress);
  let created = false;
  if (!marketPosition) {
    created = true;
    const marketPositionId = getMarketPositionId(accountAddress, marketAddress);
    marketPosition = new MarketPosition(marketPositionId);
    marketPosition.account = accountAddress;
    marketPosition.accountPool = getOrCreateAccountPool(accountAddress, poolAddress).id;
    marketPosition.market = marketAddress;
    marketPosition.enteredMarket = enteredMarket;
    marketPosition.accrualBlockNumber = zeroBigInt32;

    const vTokenContract = VTokenContract.bind(marketAddress);

    marketPosition.vTokenBalanceMantissa = zeroBigInt32;
    marketPosition.storedBorrowBalanceMantissa = zeroBigInt32;
    marketPosition.borrowIndex = vTokenContract.borrowIndex();

    marketPosition.totalUnderlyingRedeemedMantissa = zeroBigInt32;
    marketPosition.totalUnderlyingRepaidMantissa = zeroBigInt32;
    marketPosition.enteredMarket = false;
    marketPosition.save();
  }
  return { entity: marketPosition, created };
};

export function getOrCreateRewardSpeed(
  rewardsDistributorAddress: Address,
  marketAddress: Address,
): RewardSpeed {
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
  return rewardSpeed as RewardSpeed;
}

export const getOrCreateRewardDistributor = (
  rewardsDistributorAddress: Address,
  comptrollerAddress: Address,
): RewardsDistributor => {
  const id = getRewardsDistributorId(rewardsDistributorAddress);
  let rewardsDistributor = RewardsDistributor.load(id);

  if (!rewardsDistributor) {
    rewardsDistributor = createRewardDistributor(rewardsDistributorAddress, comptrollerAddress);
  }

  return rewardsDistributor as RewardsDistributor;
};
