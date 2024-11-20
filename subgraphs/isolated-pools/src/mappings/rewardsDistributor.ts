import { RewardTokenBorrowSpeedUpdated, RewardTokenSupplySpeedUpdated } from '../../generated/templates/RewardsDistributor/RewardsDistributor';
import { getOrCreateRewardSpeed } from '../operations/getOrCreate';

export function handleRewardTokenBorrowSpeedUpdated(event: RewardTokenBorrowSpeedUpdated): void {
  const rewardSpeed = getOrCreateRewardSpeed(event.address, event.params.vToken);
  rewardSpeed.borrowSpeedPerBlockMantissa = event.params.newSpeed;
  rewardSpeed.save();
}

export function handleRewardTokenSupplySpeedUpdated(event: RewardTokenSupplySpeedUpdated): void {
  const rewardSpeed = getOrCreateRewardSpeed(event.address, event.params.vToken);
  rewardSpeed.supplySpeedPerBlockMantissa = event.params.newSpeed;
  rewardSpeed.save();
}
