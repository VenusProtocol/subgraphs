import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  RewardTokenBorrowSpeedUpdated as RewardTokenBorrowSpeedUpdatedEvent,
  RewardTokenSupplySpeedUpdated as RewardTokenSupplySpeedUpdatedEvent,
} from '../../generated/templates/RewardsDistributor/RewardsDistributor';

export const createRewardTokenBorrowSpeedUpdatedEvent = (
  rewardsDistributorAddress: Address,
  vTokenAddress: Address,
  newSpeed: BigInt,
): RewardTokenBorrowSpeedUpdatedEvent => {
  const event = changetype<RewardTokenBorrowSpeedUpdatedEvent>(newMockEvent());
  event.address = rewardsDistributorAddress;
  event.parameters = [];
  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const newSpeedValue = ethereum.Value.fromUnsignedBigInt(newSpeed);
  const newSpeedParam = new ethereum.EventParam('newSpeed', newSpeedValue);
  event.parameters.push(newSpeedParam);

  return event;
};

export const createRewardTokenSupplySpeedUpdatedEvent = (
  rewardsDistributorAddress: Address,
  vTokenAddress: Address,
  newSpeed: BigInt,
): RewardTokenSupplySpeedUpdatedEvent => {
  const event = changetype<RewardTokenSupplySpeedUpdatedEvent>(newMockEvent());
  event.address = rewardsDistributorAddress;
  event.parameters = [];
  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const newSpeedValue = ethereum.Value.fromUnsignedBigInt(newSpeed);
  const newSpeedParam = new ethereum.EventParam('newSpeed', newSpeedValue);
  event.parameters.push(newSpeedParam);

  return event;
};
