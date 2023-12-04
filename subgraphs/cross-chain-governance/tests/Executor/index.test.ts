import { Address, Bytes } from '@graphprotocol/graph-ts';
import { assert, describe, test } from 'matchstick-as/assembly';

import {
  handleProposalCancelled,
  handleProposalExecuted,
  handleProposalQueued,
  handleProposalReceived,
  handleReceivePayloadFailed,
  handleSetMaxDailyReceiveLimit,
  handleTimelockAdded,
} from '../../src/mappings/omnichainGovernanceExecutor';
import {
  createProposalCancelledEvent,
  createProposalExecutedEvent,
  createProposalQueuedEvent,
  createProposalReceivedEvent,
  createReceivePayloadFailedEvent,
  createSetMaxDailyReceiveLimitEvent,
  createTimelockAddedEvent,
} from './events';

const MOCK_SRC_ADDRESS = Address.fromString('0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1');
const MOCK_TIMELOCK_ADDRESS = Address.fromString('0xb2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2');

describe('OmniGovernanceExecutor', () => {
  test('should update max daily receive limit', () => {
    const functionRegistryChangedEvent = createSetMaxDailyReceiveLimitEvent(0, 100);
    handleSetMaxDailyReceiveLimit(functionRegistryChangedEvent);

    assert.fieldEquals('Governance', 'GOVERNANCE', 'maxDailyReceiveLimit', '100');
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
    assert.fieldEquals('Proposal', '1', 'type', 'NORMAL');
  });

  test('should record queued proposal', () => {
    const proposalQueuedEvent = createProposalQueuedEvent(1, 123456789);
    handleProposalQueued(proposalQueuedEvent);

    assert.entityCount('Proposal', 1);
    assert.fieldEquals('Proposal', '1', 'queued', 'true');
  });

  test('should record executed proposal', () => {
    const proposalExecutedEvent = createProposalExecutedEvent(1);
    handleProposalExecuted(proposalExecutedEvent);

    assert.entityCount('Proposal', 1);
    assert.fieldEquals('Proposal', '1', 'executionEta', '123456789');
    assert.fieldEquals('Proposal', '1', 'queued', 'true');
    assert.fieldEquals('Proposal', '1', 'executed', 'true');
  });

  test('should record cancelled proposal', () => {
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
    handleProposalCancelled(proposalCanceledEventEvent);

    assert.entityCount('Proposal', 2);
    assert.fieldEquals('Proposal', '2', 'cancelled', 'true');
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
});
