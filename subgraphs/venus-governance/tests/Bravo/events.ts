import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  VotingDelaySet,
  VotingPeriodSet,
} from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';

export function createNewVotingDelayEvent(
  governanceAddress: Address,
  oldVotingDelay: BigInt,
  newVotingDelay: BigInt,
): VotingDelaySet {
  const event = changetype<VotingDelaySet>(newMockEvent());
  event.address = governanceAddress;
  event.parameters = [];

  const oldVotingDelayParam = new ethereum.EventParam(
    'oldVotingDelay',
    ethereum.Value.fromUnsignedBigInt(oldVotingDelay),
  );
  event.parameters.push(oldVotingDelayParam);

  const newVotingDelayParam = new ethereum.EventParam(
    'newVotingDelay',
    ethereum.Value.fromUnsignedBigInt(newVotingDelay),
  );
  event.parameters.push(newVotingDelayParam);

  return event;
}

export function createNewVotingPeriodEvent(
  governanceAddress: Address,
  oldVotingPeriod: BigInt,
  newVotingPeriod: BigInt,
): VotingPeriodSet {
  const event = changetype<VotingPeriodSet>(newMockEvent());
  event.address = governanceAddress;
  event.parameters = [];

  const oldVotingPeriodParam = new ethereum.EventParam(
    'oldVotingPeriod',
    ethereum.Value.fromUnsignedBigInt(oldVotingPeriod),
  );
  event.parameters.push(oldVotingPeriodParam);

  const newVotingPeriodParam = new ethereum.EventParam(
    'newVotingPeriod',
    ethereum.Value.fromUnsignedBigInt(newVotingPeriod),
  );
  event.parameters.push(newVotingPeriodParam);

  return event;
}
