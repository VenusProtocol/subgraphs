import { Address, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  ProposalCancelled as ProposalCancelledEvent,
  ProposalExecuted as ProposalExecutedEvent,
  ProposalQueued as ProposalQueuedEvent,
  ProposalReceived as ProposalReceivedEvent,
  ReceivePayloadFailed as ReceivePayloadFailedEvent,
  SetMaxDailyReceiveLimit as SetMaxDailyReceiveLimitEvent,
  TimelockAdded as TimelockAddedEvent,
} from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';

export const createSetMaxDailyReceiveLimitEvent = (
  oldMaxLimit: i32,
  newMaxLimit: i32,
): SetMaxDailyReceiveLimitEvent => {
  const event = changetype<SetMaxDailyReceiveLimitEvent>(newMockEvent());

  event.parameters = [];
  const oldMaxLimitParam = new ethereum.EventParam(
    'oldMaxLimit',
    ethereum.Value.fromI32(oldMaxLimit),
  );
  event.parameters.push(oldMaxLimitParam);

  const newMaxLimitParam = new ethereum.EventParam(
    'newMaxLimit',
    ethereum.Value.fromI32(newMaxLimit),
  );
  event.parameters.push(newMaxLimitParam);

  return event;
};

export const createProposalReceivedEvent = (
  proposalId: i32,
  targets: Address[],
  values: i32[],
  signatures: string[],
  calldatas: Bytes[],
  proposalType: i32,
): ProposalReceivedEvent => {
  const event = changetype<ProposalReceivedEvent>(newMockEvent());
  event.parameters = [];

  const proposalIdParam = new ethereum.EventParam('proposalId', ethereum.Value.fromI32(proposalId));
  event.parameters.push(proposalIdParam);

  const targetsParam = new ethereum.EventParam('targets', ethereum.Value.fromAddressArray(targets));
  event.parameters.push(targetsParam);

  const valuesParam = new ethereum.EventParam('values', ethereum.Value.fromI32Array(values));
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

  const proposalTypeParam = new ethereum.EventParam(
    'proposalType',
    ethereum.Value.fromI32(proposalType),
  );
  event.parameters.push(proposalTypeParam);
  return event;
};

export const createProposalQueuedEvent = (id: i32, eta: i32): ProposalQueuedEvent => {
  const event = changetype<ProposalQueuedEvent>(newMockEvent());
  event.parameters = [];

  const idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));
  event.parameters.push(idParam);

  const etaParam = new ethereum.EventParam('eta', ethereum.Value.fromI32(eta));
  event.parameters.push(etaParam);
  return event;
};

export const createProposalExecutedEvent = (id: i32): ProposalExecutedEvent => {
  const event = changetype<ProposalExecutedEvent>(newMockEvent());
  event.parameters = [];

  const idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));
  event.parameters.push(idParam);
  return event;
};
//  // uint16 srcChainId, bytes srcAddress, uint64 nonce, bytes reason
export const createReceivePayloadFailedEvent = (
  srcChainId: i32,
  srcAddress: Address,
  nonce: i32,
  reason: Bytes,
): ReceivePayloadFailedEvent => {
  const event = changetype<ReceivePayloadFailedEvent>(newMockEvent());
  event.parameters = [];

  const srcChainIdParam = new ethereum.EventParam('srcChainId', ethereum.Value.fromI32(srcChainId));
  event.parameters.push(srcChainIdParam);

  const srcAddressParam = new ethereum.EventParam(
    'srcAddress',
    ethereum.Value.fromBytes(srcAddress),
  );
  event.parameters.push(srcAddressParam);

  const nonceParam = new ethereum.EventParam('nonce', ethereum.Value.fromI32(nonce));
  event.parameters.push(nonceParam);

  const reasonParam = new ethereum.EventParam('reason', ethereum.Value.fromBytes(reason));
  event.parameters.push(reasonParam);
  return event;
};

export const createProposalCancelledEvent = (id: i32): ProposalCancelledEvent => {
  const event = changetype<ProposalCancelledEvent>(newMockEvent());
  event.parameters = [];

  const idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));
  event.parameters.push(idParam);
  return event;
};

export const createTimelockAddedEvent = (timelock: Address, routeType: i32): TimelockAddedEvent => {
  const event = changetype<TimelockAddedEvent>(newMockEvent());
  event.parameters = [];

  const timelockParam = new ethereum.EventParam('timelock', ethereum.Value.fromAddress(timelock));
  event.parameters.push(timelockParam);

  const routeTypeParam = new ethereum.EventParam('routeType', ethereum.Value.fromI32(routeType));
  event.parameters.push(routeTypeParam);
  return event;
};
