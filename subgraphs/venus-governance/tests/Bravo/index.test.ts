import { Address, BigInt } from '@graphprotocol/graph-ts';
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
} from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';
import { GOVERNANCE } from '../../src/constants';
import {
  handleNewImplementation,
  handleProposalCanceled,
  handleProposalCreated,
  handleProposalExecuted,
  handleProposalQueued,
  handleProposalThresholdSet,
  handleVoteCast,
  handleVotingDelaySet,
  handleVotingPeriodSet,
} from '../../src/mappings/bravo';
import { getOrCreateDelegate } from '../../src/operations/getOrCreate';
import { getVoteId } from '../../src/utils/ids';
import { user1 } from '../common/constants';
import {
  createProposalCanceledEvent,
  createProposalCreatedEvent,
  createProposalExecutedEvent,
  createProposalQueuedEvent,
  createVoteCastBravoEvent,
} from '../common/events';
import {
  createNewImplementationEvent,
  createNewProposalThresholdEvent,
  createNewVotingDelayEvent,
  createNewVotingPeriodEvent,
} from './events';

const startBlock = 4563820;
const endBlock = 4593820;
const description = 'Very creative Proposal';
const governanceAddress = Address.fromString('0x0000000000000000000000000000000000000e0e');

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
});

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
    const reason = 'Good idea!';
    /** run handler */
    const voteCastEvent = createVoteCastBravoEvent(user1, 1, 1, BigInt.fromI64(votes), reason);
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

  test('registers new voting Delay', () => {
    const oldVotingDelay = BigInt.fromI32(1);
    const newVotingDelay = BigInt.fromI32(2);
    const votingDelayEvent = createNewVotingDelayEvent(
      governanceAddress,
      oldVotingDelay,
      newVotingDelay,
    );

    handleVotingDelaySet(votingDelayEvent);
    assert.fieldEquals('Governance', GOVERNANCE, 'votingDelay', newVotingDelay.toString());
  });

  test('registers new voting period', () => {
    const oldVotingPeriod = BigInt.fromI32(1);
    const newVotingPeriod = BigInt.fromI32(2);
    const votingPeriodEvent = createNewVotingPeriodEvent(
      governanceAddress,
      oldVotingPeriod,
      newVotingPeriod,
    );

    handleVotingPeriodSet(votingPeriodEvent);
    assert.fieldEquals('Governance', GOVERNANCE, 'votingPeriod', newVotingPeriod.toString());
  });

  test('registers new implementation', () => {
    const oldImplementation = Address.fromString('0x0a00000000000000000000000000000000000000');
    const newImplementation = Address.fromString('0x0b00000000000000000000000000000000000000');
    const newImplementationEvent = createNewImplementationEvent(
      governanceAddress,
      oldImplementation,
      newImplementation,
    );

    handleNewImplementation(newImplementationEvent);
    assert.fieldEquals('Governance', GOVERNANCE, 'implementation', newImplementation.toHexString());
  });

  test('registers new proposal threshold', () => {
    const oldProposalThreshold = BigInt.fromI64(300000000000000000000000);
    const newProposalThreshold = BigInt.fromI64(500000000000000000000000);
    const proposalThresholdEvent = createNewProposalThresholdEvent(
      governanceAddress,
      oldProposalThreshold,
      newProposalThreshold,
    );

    handleProposalThresholdSet(proposalThresholdEvent);
    assert.fieldEquals(
      'Governance',
      GOVERNANCE,
      'proposalThreshold',
      newProposalThreshold.toString(),
    );
  });
});
