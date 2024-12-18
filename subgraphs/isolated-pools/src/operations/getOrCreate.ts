import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { VToken as VTokenContract } from '../../generated/PoolRegistry/VToken';
import { BEP20 } from '../../generated/PoolRegistry/BEP20';
import {
  Account,
  AccountPool,
  MarketPosition,
  Market,
  Pool,
  MarketReward,
  RewardsDistributor,
  Token,
} from '../../generated/schema';
import { zeroBigInt32 } from '../constants';
import {
  getAccountPoolId,
  getMarketPositionId,
  getPoolId,
  getMarketRewardId,
  getRewardsDistributorId,
  getTokenId,
} from '../utilities/ids';
import {
  createAccount,
  createAccountPool,
  createMarket,
  createPool,
  createRewardDistributor,
} from './create';
import { getMarketPosition, getMarket } from './get';

// BIFI was delisted before it was listed. Creation ignores this market.
export const getOrCreateMarket = (
  vTokenAddress: Address,
  comptrollerAddress: Address,
  blockNumber: BigInt,
): Market | null => {
  let market = getMarket(vTokenAddress);
  if (!market) {
    market = createMarket(vTokenAddress, comptrollerAddress, blockNumber);
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

export function getOrCreateMarketReward(
  rewardsDistributorAddress: Address,
  marketAddress: Address,
): MarketReward {
  const id = getMarketRewardId(rewardsDistributorAddress, marketAddress);
  let rewardSpeed = MarketReward.load(id);
  if (!rewardSpeed) {
    rewardSpeed = new MarketReward(id);
    rewardSpeed.rewardsDistributor = rewardsDistributorAddress;
    rewardSpeed.market = marketAddress;
    rewardSpeed.borrowSpeedPerBlockMantissa = zeroBigInt32;
    rewardSpeed.supplySpeedPerBlockMantissa = zeroBigInt32;
    rewardSpeed.supplyStateIndex = zeroBigInt32;
    rewardSpeed.supplyStateBlockNumberOrTimestamp = zeroBigInt32;
    rewardSpeed.borrowStateIndex = zeroBigInt32;
    rewardSpeed.borrowStateBlockNumberOrTimestamp = zeroBigInt32;
    rewardSpeed.supplyLastRewardingBlockTimestamp = zeroBigInt32;
    rewardSpeed.borrowLastRewardingBlockTimestamp = zeroBigInt32;
    rewardSpeed.save();
  }
  return rewardSpeed as MarketReward;
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

export function getOrCreateAnkrStakedBNBToken(): Token {
  const underlyingTokenAddress = Address.fromBytes(
    Bytes.fromHexString('0x5269b7558D3d5E113010Ef1cFF0901c367849CC9'),
  );
  let tokenEntity = Token.load(getTokenId(underlyingTokenAddress));
  if (!tokenEntity) {
    tokenEntity = new Token(getTokenId(underlyingTokenAddress));
    tokenEntity.address = underlyingTokenAddress;
    tokenEntity.name = 'Ankr Staked BNB';
    tokenEntity.symbol = 'ankrBNB ';
    tokenEntity.decimals = 18;
    tokenEntity.save();
  }
  return tokenEntity;
}

export function getOrCreateWrappedEthToken(): Token {
  const underlyingTokenAddress = Address.fromBytes(
    Bytes.fromHexString('0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'),
  );
  let tokenEntity = Token.load(getTokenId(underlyingTokenAddress));
  if (!tokenEntity) {
    tokenEntity = new Token(getTokenId(underlyingTokenAddress));
    tokenEntity.address = underlyingTokenAddress;
    tokenEntity.name = 'Wrapped Ether';
    tokenEntity.symbol = 'WETH ';
    tokenEntity.decimals = 18;
    tokenEntity.save();
  }
  return tokenEntity;
}
/**
 * Creates and Token object with symbol and address
 *
 * @param asset Address of the token
 * @returns Token
 */
export function getOrCreateToken(asset: Address): Token {
  let tokenEntity = Token.load(getTokenId(asset));

  if (!tokenEntity) {
    const erc20 = BEP20.bind(asset);
    tokenEntity = new Token(getTokenId(asset));
    tokenEntity.address = asset;
    tokenEntity.name = erc20.name();
    tokenEntity.symbol = erc20.symbol();
    tokenEntity.decimals = erc20.decimals();
    tokenEntity.save();
  }
  return tokenEntity;
}
