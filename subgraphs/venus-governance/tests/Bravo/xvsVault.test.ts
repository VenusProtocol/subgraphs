import { BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { ProposalCreated } from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';
import { DelegateChangedV2 } from '../../generated/XVSVault/XVSVault';
import { handleProposalCreated } from '../../src/mappings/bravo';
import { handleDelegateChanged } from '../../src/mappings/xvsVault';
import { getOrCreateDelegate } from '../../src/operations/getOrCreate';
import { user1, user2, user3 } from '../common/constants';
import { createDelegateChangedEvent, createProposalCreatedEvent } from '../common/events';

const cleanup = (): void => {
  clearStore();
};

const startBlock = 4563820;
const endBlock = 4593820;
const description = 'Very creative Proposal';

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

describe('XVS Token', () => {
  test('delegate changed', () => {
    const delegator = user1;
    const fromDelegate = user2;
    const toDelegate = user3;
    /** run handler */
    const delegateChangedEvent = createDelegateChangedEvent<DelegateChangedV2>(
      delegator,
      fromDelegate,
      toDelegate,
    );
    handleDelegateChanged(delegateChangedEvent);
    // OldDelegate
    const assertOldDelegateDocument = (key: string, value: string): void => {
      assert.fieldEquals('Delegate', user2.toHex(), key, value);
    };
    assertOldDelegateDocument('tokenHoldersRepresentedAmount', '-1');

    // New Delegate
    const assertNewDelegateDocument = (key: string, value: string): void => {
      assert.fieldEquals('Delegate', user3.toHex(), key, value);
    };
    assertNewDelegateDocument('tokenHoldersRepresentedAmount', '1');

    // TokenHolder
    const assertTokenHolderDocument = (key: string, value: string): void => {
      assert.fieldEquals('TokenHolder', user1.toHex(), key, value);
    };
    assertTokenHolderDocument('delegate', user3.toHexString());
  });
});
