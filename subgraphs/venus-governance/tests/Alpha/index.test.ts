import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
} from '../../generated/GovernorAlpha/GovernorAlpha';
import { GOVERNANCE } from '../../src/constants';
import {
  handleProposalCanceled,
  handleProposalCreated,
  handleProposalExecuted,
  handleProposalQueued,
  handleVoteCast,
} from '../../src/mappings/alpha';
import { getOrCreateDelegate } from '../../src/operations/getOrCreate';
import { getVoteId } from '../../src/utils/ids';
import { user1 } from '../common/constants';
import {
  createProposalCanceledEvent,
  createProposalCreatedEvent,
  createProposalExecutedEvent,
  createProposalQueuedEvent,
  createVoteCastAlphaEvent,
} from '../common/events';

const cleanup = (): void => {
  clearStore();
};

const startBlock = 4563820;
const endBlock = 4593820;
const description = 'Very creative Proposal';

beforeEach(() => {
  getOrCreateDelegate(user1.toHexString());
  const proposalCreatedEvent = createProposalCreatedEvent<ProposalCreated>(
    1,
    user1,
    [Address.fromString('0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396')], // targets
    [BigInt.fromI32(0)], // values
    ['setPendingAdmin(address)'], // signatures
    [Bytes.fromHexString('0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396')], // params
    BigInt.fromI64(startBlock),
    BigInt.fromI64(endBlock),
    description,
  );
  handleProposalCreated(proposalCreatedEvent);
});

afterEach(() => {
  cleanup();
});

describe('Alpha', () => {
  test('proposal created', () => {
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
    assertProposalDocument('targets', '[0x939bd8d64c0a9583a7dcea9933f7b21697ab6396]');
    assertProposalDocument('values', '[0]');
    assertProposalDocument('signatures', '[setPendingAdmin(address)]');
    assertProposalDocument('calldatas', '[0x939bd8d64c0a9583a7dcea9933f7b21697ab6396]');
    assertProposalDocument('startBlock', `${startBlock}`);
    assertProposalDocument('endBlock', `${endBlock}`);
    assertProposalDocument('description', description);
    assertProposalDocument('status', 'PENDING');
  });

  test('cancel proposal', () => {
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
    const eta = 1661361080;
    const proposalQueuedEvent = createProposalQueuedEvent<ProposalQueued>(1, BigInt.fromU64(eta));
    /** run handler */
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
    assertGovernanceDocument('proposalsQueued', '1');
  });

  test('proposal executed', () => {
    /** Setup test */
    const eta = 1661361080;
    const proposalQueuedEvent = createProposalQueuedEvent<ProposalQueued>(1, BigInt.fromU64(eta));
    handleProposalQueued(proposalQueuedEvent);
    /** run handler */
    const proposalExecutedEvent = createProposalExecutedEvent<ProposalExecuted>(1);
    handleProposalExecuted(proposalExecutedEvent);

    // Proposal
    const assertProposalDocument = (key: string, value: string): void => {
      assert.fieldEquals('Proposal', '1', key, value);
    };

    const assertGovernanceDocument = (key: string, value: string): void => {
      assert.fieldEquals('Governance', GOVERNANCE, key, value);
    };

    assertProposalDocument('status', 'EXECUTED');
    assertProposalDocument('executionETA', 'null');
    assertGovernanceDocument('proposalsQueued', '0');
  });

  test('vote cast', () => {
    /** Setup test */
    const votes = 300000000000000000000000000000;
    /** run handler */
    const voteCastEvent = createVoteCastAlphaEvent(user1, 1, true, BigInt.fromI64(votes));
    handleVoteCast(voteCastEvent);

    // Vote
    const assertVoteDocument = (key: string, value: string): void => {
      const voteId = getVoteId(user1, BigInt.fromI32(1));
      assert.fieldEquals('Vote', voteId, key, value);
    };

    assertVoteDocument('proposal', '1');
    assertVoteDocument('voter', user1.toHexString());
    assertVoteDocument('votes', votes.toString());
    assertVoteDocument('support', 'FOR');
    assertVoteDocument('votes', votes.toString());

    assert.fieldEquals('Proposal', '1', 'status', 'ACTIVE');
  });
});
