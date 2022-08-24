import { BigInt } from '@graphprotocol/graph-ts';
import { afterEach, assert, clearStore, describe, test } from 'matchstick-as/assembly/index';

import { ProposalCanceled, ProposalCreated } from '../../generated/GovernorAlpha/GovernorAlpha';
import { handleProposalCanceled, handleProposalCreated } from '../../src/mappings/alpha';
import { user1 } from '../common/constants';
import { createProposalCanceledEvent, createProposalCreatedEvent } from '../common/events';

const cleanup = (): void => {
  clearStore();
};

afterEach(() => {
  cleanup();
});

describe('Alpha', () => {
  test('proposal created', () => {
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
});
