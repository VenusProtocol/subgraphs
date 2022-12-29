import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import { VoteCast as VoteCastAlpha } from '../../generated/GovernorAlpha/GovernorAlpha';
import { VoteCast as VoteCastBravo } from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';

export function createProposalCreatedEvent<E>(
  id: i32,
  proposer: Address,
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  startBlock: BigInt,
  endBlock: BigInt,
  description: string,
): E {
  const event = changetype<E>(newMockEvent());
  event.parameters = [];

  const idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));
  event.parameters.push(idParam);

  const proposerParam = new ethereum.EventParam('proposer', ethereum.Value.fromAddress(proposer));
  event.parameters.push(proposerParam);

  const targetsParam = new ethereum.EventParam('targets', ethereum.Value.fromAddressArray(targets));
  event.parameters.push(targetsParam);

  const valuesParam = new ethereum.EventParam(
    'values',
    ethereum.Value.fromUnsignedBigIntArray(values),
  );
  event.parameters.push(valuesParam);

  const signaturesParam = new ethereum.EventParam(
    'signatures',
    ethereum.Value.fromStringArray(signatures),
  );
  event.parameters.push(signaturesParam);

  const calldatasParam = new ethereum.EventParam(
    'calldatas',
    ethereum.Value.fromBytesArray(calldatas),
  );
  event.parameters.push(calldatasParam);

  const startBlockParam = new ethereum.EventParam(
    'startBlock',
    ethereum.Value.fromUnsignedBigInt(startBlock),
  );
  event.parameters.push(startBlockParam);

  const endBlockParam = new ethereum.EventParam(
    'endBlock',
    ethereum.Value.fromUnsignedBigInt(endBlock),
  );
  event.parameters.push(endBlockParam);

  const descriptionParam = new ethereum.EventParam(
    'description',
    ethereum.Value.fromString(description),
  );
  event.parameters.push(descriptionParam);

  return event;
}

export function createProposalCreatedV2Event<E>(
  id: i32,
  proposer: Address,
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  startBlock: BigInt,
  endBlock: BigInt,
  description: string,
  proposalType: BigInt,
): E {
  const event = createProposalCreatedEvent<E>(
    id,
    proposer,
    targets,
    values,
    signatures,
    calldatas,
    startBlock,
    endBlock,
    description,
  );
  const proposalTypeParam = new ethereum.EventParam(
    'proposalType',
    ethereum.Value.fromUnsignedBigInt(proposalType),
  );
  event.parameters.push(proposalTypeParam);
  return event;
}

export function createProposalCanceledEvent<E>(id: i32): E {
  const event = changetype<E>(newMockEvent());
  event.parameters = [];

  const idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));
  event.parameters.push(idParam);
  return event;
}

export function createProposalQueuedEvent<E>(id: i32, eta: BigInt): E {
  const event = changetype<E>(newMockEvent());
  event.parameters = [];

  const idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));
  event.parameters.push(idParam);

  const etaParam = new ethereum.EventParam('eta', ethereum.Value.fromUnsignedBigInt(eta));
  event.parameters.push(etaParam);

  return event;
}

export function createProposalExecutedEvent<E>(id: i32): E {
  const event = changetype<E>(newMockEvent());
  event.parameters = [];

  const idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));
  event.parameters.push(idParam);

  return event;
}

export function createVoteCastAlphaEvent(
  voter: Address,
  proposalId: i32,
  support: boolean,
  votes: BigInt,
): VoteCastAlpha {
  const event = changetype<VoteCastAlpha>(newMockEvent());
  event.parameters = [];

  const voterParam = new ethereum.EventParam('voter', ethereum.Value.fromAddress(voter));
  event.parameters.push(voterParam);

  const proposalIdParam = new ethereum.EventParam('proposalId', ethereum.Value.fromI32(proposalId));
  event.parameters.push(proposalIdParam);

  const supportParam = new ethereum.EventParam('proposalId', ethereum.Value.fromBoolean(support));
  event.parameters.push(supportParam);

  const votesParam = new ethereum.EventParam('votes', ethereum.Value.fromUnsignedBigInt(votes));
  event.parameters.push(votesParam);

  return event;
}

export function createVoteCastBravoEvent(
  voter: Address,
  proposalId: i32,
  support: i32,
  votes: BigInt,
  reason: string,
): VoteCastBravo {
  const event = changetype<VoteCastBravo>(newMockEvent());
  event.parameters = [];

  const voterParam = new ethereum.EventParam('voter', ethereum.Value.fromAddress(voter));
  event.parameters.push(voterParam);

  const proposalIdParam = new ethereum.EventParam('proposalId', ethereum.Value.fromI32(proposalId));
  event.parameters.push(proposalIdParam);

  const supportParam = new ethereum.EventParam('proposalId', ethereum.Value.fromI32(support));
  event.parameters.push(supportParam);

  const votesParam = new ethereum.EventParam('votes', ethereum.Value.fromUnsignedBigInt(votes));
  event.parameters.push(votesParam);

  const reasonParam = new ethereum.EventParam('reason', ethereum.Value.fromString(reason));
  event.parameters.push(reasonParam);

  return event;
}

export function createDelegateChangedEvent<E>(
  delegator: Address,
  fromDelegate: Address,
  toDelegate: Address,
): E {
  const event = changetype<E>(newMockEvent());
  event.parameters = [];

  const delegatorParam = new ethereum.EventParam(
    'delegator',
    ethereum.Value.fromAddress(delegator),
  );
  event.parameters.push(delegatorParam);

  const fromDelegateParam = new ethereum.EventParam(
    'fromDelegate',
    ethereum.Value.fromAddress(fromDelegate),
  );
  event.parameters.push(fromDelegateParam);

  const toDelegateParam = new ethereum.EventParam(
    'toDelegate',
    ethereum.Value.fromAddress(toDelegate),
  );
  event.parameters.push(toDelegateParam);

  return event;
}

export function createDelegateVotesChangedEvent<E>(
  delegate: Address,
  previousBalance: BigInt,
  newBalance: BigInt,
): E {
  const event = changetype<E>(newMockEvent());
  event.parameters = [];

  const delegateParam = new ethereum.EventParam('delegate', ethereum.Value.fromAddress(delegate));
  event.parameters.push(delegateParam);

  const previousBalanceParam = new ethereum.EventParam(
    'previousBalance',
    ethereum.Value.fromUnsignedBigInt(previousBalance),
  );
  event.parameters.push(previousBalanceParam);

  const newBalanceParam = new ethereum.EventParam(
    'newBalance',
    ethereum.Value.fromUnsignedBigInt(newBalance),
  );
  event.parameters.push(newBalanceParam);

  return event;
}

export function createPermissionEvent<E>(
  address: Address,
  contractAddress: Address,
  functionSig: string,
): E {
  const event = changetype<E>(newMockEvent());
  event.parameters = [];

  const addressParam = new ethereum.EventParam('address', ethereum.Value.fromAddress(address));
  event.parameters.push(addressParam);

  const contractAddressParam = new ethereum.EventParam(
    'contractAddress',
    ethereum.Value.fromAddress(contractAddress),
  );
  event.parameters.push(contractAddressParam);

  const functionSigParam = new ethereum.EventParam(
    'functionSig',
    ethereum.Value.fromString(functionSig),
  );
  event.parameters.push(functionSigParam);

  return event;
}
