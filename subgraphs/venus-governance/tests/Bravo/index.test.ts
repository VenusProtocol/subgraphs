import { BigInt } from '@graphprotocol/graph-ts';
import { afterEach, assert, beforeEach, clearStore, describe, test } from 'matchstick-as/assembly/index';

import {
  ProposalCanceled,
  ProposalCreated,
  ProposalQueued,
} from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';
import { GOVERNANCE } from '../../src/constants';
import { handleProposalCanceled, handleProposalCreated, handleProposalQueued } from '../../src/mappings/bravo';
import { user1 } from '../common/constants';
import { getOrCreateDelegate } from '../../src/operations/getOrCreate';
import { createProposalCanceledEvent, createProposalCreatedEvent, createProposalQueuedEvent } from '../common/events';

const startBlock = 4563820;
const endBlock = 4593820;
const description = 'Very creative Proposal';

const cleanup = (): void => {
  clearStore();
};

beforeEach(() => {
  /** setup test */
  getOrCreateDelegate(user1.toHexString());
  const proposalCreatedEvent = createProposalCreatedEvent<ProposalCreated>(
    1,
    user1,
    [],
    [],
    [],
    [],
    BigInt.fromI64(startBlock),
    BigInt.fromI64(endBlock),
    description,
  );
  handleProposalCreated(proposalCreatedEvent);
})

afterEach(() => {
  cleanup();
});

describe('Bravo', () => {
  test('create proposal', () => {
    /** setup test */
    const startBlock = 4563820;
    const endBlock = 4593820;
    const description = 'Very creative Proposal';
    const proposalCreatedEvent = createProposalCreatedEvent<ProposalCreated>(
      1,
      user1,
      [],
      [],
      [],
      [],
      BigInt.fromI64(startBlock),
      BigInt.fromI64(endBlock),
      description,
    );
    handleProposalCreated(proposalCreatedEvent);
    // Delegate
    const assertDelegateDocument = (key: string, value: string): void => {
      assert.fieldEquals('Delegate', user1.toHex(), key, value);
    };
    assertDelegateDocument('id', user1.toHexString());
    assertDelegateDocument('delegatedVotes', '0');
    assertDelegateDocument('tokenHoldersRepresentedAmount', '0');

    // Proposal
    const assertProposalDocument = (key: string, value: string): void => {
      assert.fieldEquals('Proposal', '1', key, value);
    };
    assertProposalDocument('id', '1');
    assertProposalDocument('proposer', user1.toHexString());
    assertProposalDocument('targets', '[]');
    assertProposalDocument('values', '[]');
    assertProposalDocument('signatures', '[]');
    assertProposalDocument('calldatas', '[]');
    assertProposalDocument('startBlock', `${startBlock}`);
    assertProposalDocument('endBlock', `${endBlock}`);
    assertProposalDocument('description', description);
    assertProposalDocument('status', 'PENDING');
  });

  test('cancel proposal', () => {
    /** setup test */
    const startBlock = 4563820;
    const endBlock = 4593820;
    const description = 'Very creative Proposal';
    const proposalCreatedEvent = createProposalCreatedEvent<ProposalCreated>(
      1,
      user1,
      [],
      [],
      [],
      [],
      BigInt.fromI64(startBlock),
      BigInt.fromI64(endBlock),
      description,
    );
    handleProposalCreated(proposalCreatedEvent);
    /** run handler */
    const proposalCanceledEvent = createProposalCanceledEvent<ProposalCanceled>(1);
    handleProposalCanceled(proposalCanceledEvent);

    // Proposal
    const assertProposalDocument = (key: string, value: string): void => {
      assert.fieldEquals('Proposal', '1', key, value);
    };
    assertProposalDocument('status', 'CANCELLED');
  });

  test('queue proposal', () => {
    /** run handler */
    const eta = 1661361080;
    const proposalQueuedEvent = createProposalQueuedEvent<ProposalQueued>(1, BigInt.fromU64(eta));
    handleProposalQueued(proposalQueuedEvent);

    // Proposal
    const assertProposalDocument = (key: string, value: string): void => {
      assert.fieldEquals('Proposal', '1', key, value);
    };

    const assertGovernanceDocument = (key: string, value: string): void => {
      assert.fieldEquals('Governance', GOVERNANCE, key, value);
    };

    assertProposalDocument('status', 'QUEUED');
    assertProposalDocument('executionETA', eta.toString());
    assertGovernanceDocument('proposalsQueued', '1')
  });
});
