import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  NewGuardian as NewGuardianEvent,
  ProposalCanceled as ProposalCanceledEvent,
  ProposalExecuted as ProposalExecutedEvent,
  ProposalQueued as ProposalQueuedEvent,
  ProposalReceived as ProposalReceivedEvent,
  ReceivePayloadFailed as ReceivePayloadFailedEvent,
  RetryMessageSuccess as RetryMessageSuccessEvent,
  SetMaxDailyReceiveLimit as SetMaxDailyReceiveLimitEvent,
  SetMinDstGas as SetMinDstGasEvent,
  SetPrecrime as SetPrecrimeEvent,
  SetSrcChainId as SetSrcChainIdEvent,
  TimelockAdded as TimelockAddedEvent,
} from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';
import { nullAddress } from '../../src/constants/addresses';

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

export const createProposalCancelledEvent = (id: i32): ProposalCanceledEvent => {
  const event = changetype<ProposalCanceledEvent>(newMockEvent());
  event.parameters = [];

  const idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));
  event.parameters.push(idParam);
  return event;
};

export const createTimelockAddedEvent = (timelock: Address, routeType: i32): TimelockAddedEvent => {
  const event = changetype<TimelockAddedEvent>(newMockEvent());
  event.parameters = [];

  const routeTypeParam = new ethereum.EventParam('routeType', ethereum.Value.fromI32(routeType));
  event.parameters.push(routeTypeParam);

  const oldTimelockParam = new ethereum.EventParam(
    'oldTimelock',
    ethereum.Value.fromAddress(nullAddress),
  );
  event.parameters.push(oldTimelockParam);

  const timelockParam = new ethereum.EventParam(
    'newTimelock',
    ethereum.Value.fromAddress(timelock),
  );
  event.parameters.push(timelockParam);

  return event;
};

export const createNewGuardianEvent = (
  oldGuardian: Address,
  newGuardian: Address,
): NewGuardianEvent => {
  const event = changetype<NewGuardianEvent>(newMockEvent());
  event.parameters = [];
  const oldGuardianParam = new ethereum.EventParam(
    'oldGuardian',
    ethereum.Value.fromAddress(oldGuardian),
  );
  event.parameters.push(oldGuardianParam);

  const newGuardianParam = new ethereum.EventParam(
    'newGuardian',
    ethereum.Value.fromAddress(newGuardian),
  );
  event.parameters.push(newGuardianParam);
  return event;
};

export const createRetryMessageSuccessEvent = (
  srcChainId: i32,
  srcAddress: Address,
  nonce: i32,
  payloadHash: Bytes,
): RetryMessageSuccessEvent => {
  const event = changetype<RetryMessageSuccessEvent>(newMockEvent());
  event.parameters = [];

  const srcChainIdParam = new ethereum.EventParam(
    '_srcChainId',
    ethereum.Value.fromI32(srcChainId),
  );
  event.parameters.push(srcChainIdParam);

  const srcAddressParam = new ethereum.EventParam(
    '_srcAddress',
    ethereum.Value.fromAddress(srcAddress),
  );
  event.parameters.push(srcAddressParam);

  const nonceParam = new ethereum.EventParam('_nonce', ethereum.Value.fromI32(nonce));
  event.parameters.push(nonceParam);

  const payloadHashParam = new ethereum.EventParam(
    '_payloadHash',
    ethereum.Value.fromBytes(payloadHash),
  );
  event.parameters.push(payloadHashParam);
  return event;
};

export const createSetMinDstGasEvent = (
  dstChainId: i32,
  type: i32,
  minDstGas: BigInt,
): SetMinDstGasEvent => {
  const event = changetype<SetMinDstGasEvent>(newMockEvent());
  event.parameters = [];
  const dstChainIdParam = new ethereum.EventParam(
    '_dstChainId',
    ethereum.Value.fromI32(dstChainId),
  );
  event.parameters.push(dstChainIdParam);

  const typeParam = new ethereum.EventParam('_type', ethereum.Value.fromI32(type));
  event.parameters.push(typeParam);

  const minDstGasParam = new ethereum.EventParam(
    '_minDstGas',
    ethereum.Value.fromUnsignedBigInt(minDstGas),
  );
  event.parameters.push(minDstGasParam);
  return event;
};

export const createSetPrecrimeEvent = (precrime: Address): SetPrecrimeEvent => {
  const event = changetype<SetPrecrimeEvent>(newMockEvent());
  event.parameters = [];

  const precrimeParam = new ethereum.EventParam('precrime', ethereum.Value.fromAddress(precrime));
  event.parameters.push(precrimeParam);
  return event;
};

export const createSetSrcChainIdEvent = (
  oldSrcChainId: i32,
  newSrcChainId: i32,
): SetSrcChainIdEvent => {
  const event = changetype<SetSrcChainIdEvent>(newMockEvent());
  event.parameters = [];
  const oldSrcChainIdParam = new ethereum.EventParam(
    'oldSrcChainId',
    ethereum.Value.fromI32(oldSrcChainId),
  );
  event.parameters.push(oldSrcChainIdParam);

  const newSrcChainIdParam = new ethereum.EventParam(
    'newSrcChainId',
    ethereum.Value.fromI32(newSrcChainId),
  );
  event.parameters.push(newSrcChainIdParam);
  return event;
};
