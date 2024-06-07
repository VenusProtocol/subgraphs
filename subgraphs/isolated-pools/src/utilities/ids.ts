import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

export const getPoolId = (comptroller: Address): Bytes => comptroller;

export const getMarketId = (vTokenAddress: Address): Bytes => vTokenAddress;

export const getAccountVTokenId = (marketAddress: Address, accountAddress: Address): Bytes =>
  marketAddress.concat(accountAddress);

export const getMarketActionId = (vTokenAddress: Address, action: i32): Bytes => {
  return vTokenAddress.concat(Bytes.fromI32(action));
};

export const getTransactionEventId = (transactionHash: Bytes, transactionLogIndex: BigInt): Bytes =>
  transactionHash.concat(Bytes.fromI32(transactionLogIndex.toI32()));

export const getBadDebtEventId = (transactionHash: Bytes, transactionLogIndex: BigInt): Bytes =>
  transactionHash.concat(Bytes.fromI32(transactionLogIndex.toI32()));

export const getRewardsDistributorId = (rewardsDistributor: Address): Bytes => rewardsDistributor;

export const getRewardSpeedId = (
  rewardsDistributorAddress: Address,
  marketAddress: Address,
): Bytes => rewardsDistributorAddress.concat(marketAddress);
