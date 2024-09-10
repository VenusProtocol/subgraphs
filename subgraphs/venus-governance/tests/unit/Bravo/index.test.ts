import { Address, BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { ProposalCreated as ProposalCreatedV2 } from '../../../generated/GovernorBravoDelegate2/GovernorBravoDelegate2';
import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
} from '../../../generated/GovernorBravoDelegate/GovernorBravoDelegate';
import { Delegate } from '../../../generated/schema';
import { GOVERNANCE } from '../../../src/constants';
import {
  handleBravoVoteCast,
  handleNewAdmin,
  handleNewGuardian,
  handleNewImplementation,
  handleNewPendingAdmin,
  handleProposalCanceled,
  handleProposalCreated,
  handleProposalCreatedV2,
  handleProposalExecuted,
  handleProposalMaxOperationsUpdated,
  handleProposalQueued,
} from '../../../src/mappings/bravo';
import { getOrCreateDelegate } from '../../../src/operations/getOrCreate';
import { getVoteId } from '../../../src/utilities/ids';
import { user1 } from '../../common/constants';
import {
  createProposalCanceledEvent,
  createProposalCreatedEvent,
  createProposalCreatedV2Event,
  createProposalExecutedEvent,
  createProposalQueuedEvent,
  createVoteCastBravoEvent,
} from '../../common/events';
import { createGovernorBravoMocks } from '../../common/mocks';
import {
  createNewAdminEvent,
  createNewGuardianEvent,
  createNewImplementationEvent,
  createNewPendingAdminEvent,
  createNewProposalMaxOperationsEvent,
} from './events';

const startBlock = 4563820;
const endBlock = 4593820;
const description = 'Very creative Proposal';
const governanceAddress = Address.fromString('0x0000000000000000000000000000000000000e0e');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createGovernorBravoMocks();
});

beforeEach(() => {
  /** setup test */
  getOrCreateDelegate(user1);
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
    assertDelegateDocument('totalVotesMantissa', '0');
    assertDelegateDocument('delegateCount', '0');

    const delegate = Delegate.load(user1)!;
    const proposals = delegate.proposals.load();
    assert.stringEquals('1', proposals[0].id.toString());

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
  });

  test('create proposal V2', () => {
    /** setup test */
    const startBlock = 4563820;
    const endBlock = 4593820;
    const description = 'Very creative Proposal';
    const proposalCreatedEvent = createProposalCreatedV2Event<ProposalCreatedV2>(
      1,
      user1,
      [],
      [],
      [],
      [],
      BigInt.fromI64(startBlock),
      BigInt.fromI64(endBlock),
      description,
      BigInt.fromI64(2),
    );
    handleProposalCreatedV2(proposalCreatedEvent);
    // Delegate
    const assertDelegateDocument = (key: string, value: string): void => {
      assert.fieldEquals('Delegate', user1.toHex(), key, value);
    };
    assertDelegateDocument('id', user1.toHexString());
    assertDelegateDocument('totalVotesMantissa', '0');
    assertDelegateDocument('delegateCount', '0');

    const delegate = Delegate.load(user1)!;
    const proposals = delegate.proposals.load();
    assert.stringEquals('1', proposals[0].id.toString());

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
    assertProposalDocument('type', 'CRITICAL');
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
    assertProposalDocument('canceled', proposalCanceledEvent.transaction.hash.toHexString());
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

    assertProposalDocument('queued', proposalQueuedEvent.transaction.hash.toHexString());
    assertProposalDocument('executionEta', eta.toString());
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

    assertProposalDocument('executed', proposalExecutedEvent.transaction.hash.toHexString());
  });

  test('vote cast', () => {
    /** Setup test */
    const votes = 300000000000000000000000000000;
    const reason = 'Good idea!';
    /** run handler */
    const voteCastEvent = createVoteCastBravoEvent(user1, 1, 1, BigInt.fromI64(votes), reason);
    handleBravoVoteCast(voteCastEvent);

    // Vote
    const assertVoteDocument = (key: string, value: string): void => {
      const voteId = getVoteId(user1, BigInt.fromI32(1)).toHexString();
      assert.fieldEquals('Vote', voteId, key, value);
    };

    assertVoteDocument('proposal', '1');
    assertVoteDocument('voter', user1.toHexString());
    assertVoteDocument('votes', votes.toString());
    assertVoteDocument('support', 'FOR');
    assertVoteDocument('votes', votes.toString());
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

  test('registers new pending admin', () => {
    const oldPendingAdmin = Address.fromString('0x0000000000000000000000000000000000000000');
    const newPendingAdmin = Address.fromString('0x0b00000000000000000000000000000000000000');
    const pendingAdminEvent = createNewPendingAdminEvent(
      governanceAddress,
      oldPendingAdmin,
      newPendingAdmin,
    );

    handleNewPendingAdmin(pendingAdminEvent);
    assert.fieldEquals('Governance', GOVERNANCE, 'pendingAdmin', newPendingAdmin.toHexString());
  });

  test('registers new admin', () => {
    const oldAdmin = Address.fromString('0x0000000000000000000000000000000000000000');
    const newAdmin = Address.fromString('0x0b00000000000000000000000000000000000000');
    const newAdminEvent = createNewAdminEvent(governanceAddress, oldAdmin, newAdmin);

    handleNewAdmin(newAdminEvent);
    assert.fieldEquals('Governance', GOVERNANCE, 'admin', newAdmin.toHexString());
    assert.fieldEquals('Governance', GOVERNANCE, 'pendingAdmin', 'null');
  });

  test('registers new guardian', () => {
    const oldGuardian = Address.fromString('0x0000000000000000000000000000000000000000');
    const newGuardian = Address.fromString('0x0b00000000000000000000000000000000000000');
    const newGuardianEvent = createNewGuardianEvent(governanceAddress, oldGuardian, newGuardian);

    handleNewGuardian(newGuardianEvent);
    assert.fieldEquals('Governance', GOVERNANCE, 'guardian', newGuardian.toHexString());
  });

  test('registers new proposal max operations', () => {
    const oldProposalMaxOperations = BigInt.fromI32(10);
    const newProposalMaxOperations = BigInt.fromI32(20);
    const newProposalMaxOperationsEvent = createNewProposalMaxOperationsEvent(
      governanceAddress,
      oldProposalMaxOperations,
      newProposalMaxOperations,
    );

    handleProposalMaxOperationsUpdated(newProposalMaxOperationsEvent);
    assert.fieldEquals(
      'Governance',
      GOVERNANCE,
      'proposalMaxOperations',
      newProposalMaxOperations.toString(),
    );
  });
});
