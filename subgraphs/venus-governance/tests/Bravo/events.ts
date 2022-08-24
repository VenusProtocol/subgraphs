import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import { VotingDelaySet } from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';

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
