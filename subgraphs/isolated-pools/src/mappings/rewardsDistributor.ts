import {
  MarketInitialized,
  RewardTokenBorrowSpeedUpdated,
  RewardTokenSupplySpeedUpdated,
  RewardTokenSupplyIndexUpdated,
  SupplyLastRewardingBlockUpdated,
  BorrowLastRewardingBlockUpdated,
  SupplyLastRewardingBlockTimestampUpdated,
  BorrowLastRewardingBlockTimestampUpdated,
} from '../../generated/templates/RewardsDistributor/RewardsDistributor';
import { RewardsDistributor as RewardDistributorContract } from '../../generated/templates/RewardsDistributor/RewardsDistributor';
import { zeroBigInt32 } from '../constants';
import exponentToBigInt from '../utilities/exponentToBigInt';
import { getRewardDistributor } from '../operations/get';
import { getOrCreateMarketReward } from '../operations/getOrCreate';

export function handleMarketInitialized(event: MarketInitialized): void {
  const marketReward = getOrCreateMarketReward(event.address, event.params.vToken);
  const rewardsDistributor = getRewardDistributor(event.address)!;
  if (marketReward.supplyStateIndex.equals(zeroBigInt32)) {
    marketReward.supplyStateIndex = exponentToBigInt(36);
  }
  if (marketReward.borrowStateIndex.equals(zeroBigInt32)) {
    marketReward.borrowStateIndex = exponentToBigInt(36);
  }
  if (rewardsDistributor.isTimeBased) {
    marketReward.supplyStateBlockNumberOrTimestamp = event.block.timestamp;
    marketReward.borrowStateBlockNumberOrTimestamp = event.block.timestamp;
  } else {
    marketReward.supplyStateBlockNumberOrTimestamp = event.block.number;
    marketReward.borrowStateBlockNumberOrTimestamp = event.block.number;
  }
  marketReward.save();
}

export function handleRewardTokenBorrowSpeedUpdated(event: RewardTokenBorrowSpeedUpdated): void {
  const marketReward = getOrCreateMarketReward(event.address, event.params.vToken);
  marketReward.borrowSpeedPerBlockMantissa = event.params.newSpeed;
  marketReward.save();
}

export function handleRewardTokenSupplySpeedUpdated(event: RewardTokenSupplySpeedUpdated): void {
  const marketReward = getOrCreateMarketReward(event.address, event.params.vToken);
  marketReward.supplySpeedPerBlockMantissa = event.params.newSpeed;
  marketReward.save();
}

export function handleRewardTokenSupplyIndexUpdated(event: RewardTokenSupplyIndexUpdated): void {
  const rewardDistributorContract = RewardDistributorContract.bind(event.address);
  const rewardsDistributor = getRewardDistributor(event.address)!;
  const marketReward = getOrCreateMarketReward(event.address, event.params.vToken);
  if (rewardsDistributor.isTimeBased) {
    const supplyState = rewardDistributorContract.rewardTokenSupplyStateTimeBased(
      event.params.vToken,
    );
    marketReward.supplyStateIndex = supplyState.getIndex();
    marketReward.supplyStateBlockNumberOrTimestamp = supplyState.getTimestamp();
  } else {
    const supplyState = rewardDistributorContract.rewardTokenSupplyState(event.params.vToken);
    marketReward.supplyStateIndex = supplyState.getIndex();
    marketReward.supplyStateBlockNumberOrTimestamp = supplyState.getBlock();
  }
  marketReward.save();
}

export function handleRewardTokenBorrowIndexUpdated(event: RewardTokenSupplyIndexUpdated): void {
  const rewardDistributorContract = RewardDistributorContract.bind(event.address);
  const rewardsDistributor = getRewardDistributor(event.address)!;
  const marketReward = getOrCreateMarketReward(event.address, event.params.vToken);
  if (rewardsDistributor.isTimeBased) {
    const borrowState = rewardDistributorContract.rewardTokenBorrowStateTimeBased(
      event.params.vToken,
    );
    marketReward.borrowStateIndex = borrowState.getIndex();
    marketReward.borrowStateBlockNumberOrTimestamp = borrowState.getTimestamp();
  } else {
    const borrowState = rewardDistributorContract.rewardTokenBorrowState(event.params.vToken);
    marketReward.borrowStateIndex = borrowState.getIndex();
    marketReward.borrowStateBlockNumberOrTimestamp = borrowState.getBlock();
  }
  marketReward.save();
}

export function handleSupplyLastRewardingBlockUpdated(
  event: SupplyLastRewardingBlockUpdated,
): void {
  const marketReward = getOrCreateMarketReward(event.address, event.params.vToken);
  marketReward.supplyLastRewardingBlockTimestamp = event.params.newBlock;
  marketReward.save();
}

export function handleBorrowLastRewardingBlockUpdated(
  event: BorrowLastRewardingBlockUpdated,
): void {
  const marketReward = getOrCreateMarketReward(event.address, event.params.vToken);
  marketReward.borrowLastRewardingBlockTimestamp = event.params.newBlock;
  marketReward.save();
}

export function handleSupplyLastRewardingBlockTimestampUpdated(
  event: SupplyLastRewardingBlockTimestampUpdated,
): void {
  const marketReward = getOrCreateMarketReward(event.address, event.params.vToken);
  marketReward.supplyLastRewardingBlockTimestamp = event.params.newTimestamp;
  marketReward.save();
}

export function handleBorrowLastRewardingBlockTimestampUpdated(
  event: BorrowLastRewardingBlockTimestampUpdated,
): void {
  const marketReward = getOrCreateMarketReward(event.address, event.params.vToken);
  marketReward.borrowLastRewardingBlockTimestamp = event.params.newTimestamp;
  marketReward.save();
}
