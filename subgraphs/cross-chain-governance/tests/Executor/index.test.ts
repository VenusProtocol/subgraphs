import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { assert, beforeEach, describe, test } from 'matchstick-as/assembly';

import { GOVERNANCE } from '../../src/constants';
import { nullAddress } from '../../src/constants/addresses';
import {
  handleNewGuardian,
  handlePaused,
  handleProposalCanceled,
  handleProposalExecuted,
  handleProposalQueued,
  handleProposalReceived,
  handleReceivePayloadFailed,
  handleRetryMessageSuccess,
  handleSetMaxDailyReceiveLimit,
  handleSetMinDstGas,
  handleSetPrecrime,
  handleSetSrcChainId,
  handleTimelockAdded,
  handleUnpaused,
} from '../../src/mappings/omnichainGovernanceExecutor';
import {
  createNewGuardianEvent,
  createProposalCancelledEvent,
  createProposalExecutedEvent,
  createProposalQueuedEvent,
  createProposalReceivedEvent,
  createReceivePayloadFailedEvent,
  createRetryMessageSuccessEvent,
  createSetMaxDailyReceiveLimitEvent,
  createSetMinDstGasEvent,
  createSetPrecrimeEvent,
  createSetSrcChainIdEvent,
  createTimelockAddedEvent,
} from './events';
import { createGovernanceMock } from './mocks';

const MOCK_SRC_ADDRESS = Address.fromString('0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1');
const MOCK_TIMELOCK_ADDRESS = Address.fromString('0xb2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2');
const MOCK_CONTRACT_ADDRESS = Address.fromString('0xc3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3');

describe('OmniGovernanceExecutor', () => {
  beforeEach(() => {
    createGovernanceMock();
  });
  test('should update max daily receive limit', () => {
    const functionRegistryChangedEvent = createSetMaxDailyReceiveLimitEvent(0, 100);
    handleSetMaxDailyReceiveLimit(functionRegistryChangedEvent);

    assert.fieldEquals('Governance', GOVERNANCE, 'maxDailyReceiveLimit', '100');
  });

  test('should receive proposal', () => {
    const proposalReceivedEvent = createProposalReceivedEvent(
      1,
      [MOCK_TIMELOCK_ADDRESS],
      [0],
      ['acceptAdmin()'],
      [Bytes.fromUTF8('calldata')],
      0,
    );
    handleProposalReceived(proposalReceivedEvent);

    assert.entityCount('Proposal', 1);
    assert.fieldEquals('Proposal', '1', 'targets', '[0xb2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2]');
    assert.fieldEquals('Proposal', '1', 'values', '[0]');
    assert.fieldEquals('Proposal', '1', 'signatures', '[acceptAdmin()]');
    assert.fieldEquals('Proposal', '1', 'calldatas', '[0x63616c6c64617461]');
    assert.fieldEquals('Proposal', '1', 'route', '0');
  });

  test('should record queued proposal', () => {
    const proposalQueuedEvent = createProposalQueuedEvent(1, 123456789);
    handleProposalQueued(proposalQueuedEvent);

    assert.entityCount('Proposal', 1);
    assert.fieldEquals(
      'Proposal',
      '1',
      'queued',
      proposalQueuedEvent.transaction.hash.toHexString(),
    );
  });

  test('should record executed proposal', () => {
    const proposalExecutedEvent = createProposalExecutedEvent(1);
    handleProposalExecuted(proposalExecutedEvent);

    assert.entityCount('Proposal', 1);
    assert.fieldEquals('Proposal', '1', 'executionEta', '123456789');
    assert.fieldEquals(
      'Proposal',
      '1',
      'executed',
      proposalExecutedEvent.transaction.hash.toHexString(),
    );
  });

  test('should record canceled proposal', () => {
    const proposalReceivedEvent = createProposalReceivedEvent(
      2,
      [MOCK_TIMELOCK_ADDRESS],
      [0],
      ['acceptAdmin()'],
      [Bytes.fromUTF8('calldata')],
      0,
    );
    handleProposalReceived(proposalReceivedEvent);

    const proposalCanceledEventEvent = createProposalCancelledEvent(2);
    handleProposalCanceled(proposalCanceledEventEvent);

    assert.entityCount('Proposal', 2);
    assert.fieldEquals(
      'Proposal',
      '2',
      'canceled',
      proposalCanceledEventEvent.transaction.hash.toHexString(),
    );
  });

  test('should record receive payload failed', () => {
    const receivePayloadFailedEvent = createReceivePayloadFailedEvent(
      21,
      MOCK_SRC_ADDRESS,
      12,
      Bytes.fromUTF8('Unsuccessful proposal'),
    );
    handleReceivePayloadFailed(receivePayloadFailedEvent);

    assert.entityCount('FailedPayload', 1);
    assert.fieldEquals('FailedPayload', '12', 'srcChainId', '21');
    assert.fieldEquals('FailedPayload', '12', 'srcAddress', MOCK_SRC_ADDRESS.toHexString());
    assert.fieldEquals('FailedPayload', '12', 'nonce', '12');
    assert.fieldEquals('FailedPayload', '12', 'reason', 'Unsuccessful proposal');
  });

  test('should record timelock added', () => {
    const timelockAddedEvent = createTimelockAddedEvent(MOCK_TIMELOCK_ADDRESS, 0);
    handleTimelockAdded(timelockAddedEvent);

    assert.entityCount('GovernanceRoute', 1);
  });

  test('should changing the guardian', () => {
    const newGuardianAddress = Address.fromString('0xa1b2a1b2a1b2a1b2a1b2a1b2a1b2a1b2a1b2a1b2');
    const newGuardianEvent = createNewGuardianEvent(nullAddress, newGuardianAddress);
    handleNewGuardian(newGuardianEvent);

    assert.fieldEquals('Governance', GOVERNANCE, 'guardian', newGuardianAddress.toHexString());
  });

  test('should delete failed message on successful retry', () => {
    const receivePayloadFailedEvent = createReceivePayloadFailedEvent(
      21,
      MOCK_SRC_ADDRESS,
      13,
      Bytes.fromUTF8('Unsuccessful proposal'),
    );
    handleReceivePayloadFailed(receivePayloadFailedEvent);
    assert.entityCount('FailedPayload', 2);
    const retryMessageSuccessEvent = createRetryMessageSuccessEvent(
      21,
      MOCK_SRC_ADDRESS,
      13,
      Bytes.fromI32(100),
    );
    handleRetryMessageSuccess(retryMessageSuccessEvent);
    assert.entityCount('FailedPayload', 1);
  });

  test('should handle pausing', () => {
    handlePaused();
    assert.fieldEquals('Governance', GOVERNANCE, 'paused', 'true');
  });

  test('should handle unpausing', () => {
    handleUnpaused();
    assert.fieldEquals('Governance', GOVERNANCE, 'paused', 'false');
  });

  test('should handle SetMinDstGas event', () => {
    const setMinDstGasEvent = createSetMinDstGasEvent(1, 1, BigInt.fromI64(5000000000000000000));
    handleSetMinDstGas(setMinDstGasEvent);
    assert.fieldEquals('DestinationChain', Bytes.fromI32(1).toHex(), 'chainId', '1');
    assert.fieldEquals('DestinationChain', Bytes.fromI32(1).toHex(), 'packetType', '1');
    assert.fieldEquals(
      'DestinationChain',
      Bytes.fromI32(1).toHex(),
      'minGas',
      '5000000000000000000',
    );
  });

  test('should handle SetPrecrime event', () => {
    const setPrecrimeEvent = createSetPrecrimeEvent(MOCK_CONTRACT_ADDRESS);
    handleSetPrecrime(setPrecrimeEvent);
    assert.fieldEquals('Governance', GOVERNANCE, 'precrime', MOCK_CONTRACT_ADDRESS.toHexString());
  });

  test('should handle SetSrcChainId event', () => {
    const setTrustedRemoteEvent = createSetSrcChainIdEvent(1, 200);
    handleSetSrcChainId(setTrustedRemoteEvent);
    assert.fieldEquals('Governance', GOVERNANCE, 'srcChainId', '200');
  });
});
