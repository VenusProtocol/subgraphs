import { BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { DelegateChanged, DelegateVotesChanged } from '../../generated/XVSToken/XVSToken';
import { GOVERNANCE } from '../../src/constants';
import { handleDelegateChanged, handleDelegateVotesChanged } from '../../src/mappings/xvsToken';
import { getGovernanceEntity } from '../../src/operations/get';
import { user1, user2, user3 } from '../common/constants';
import { createDelegateChangedEvent, createDelegateVotesChangedEvent } from '../common/events';

const originalBalance = BigInt.fromI64(700000000000000000000000000000);

const cleanup = (): void => {
  clearStore();
};

beforeEach(() => {
  /** setup test */
  const governance = getGovernanceEntity();
  governance.delegatedVotes = originalBalance;
  governance.save();
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
    const delegateChangedEvent = createDelegateChangedEvent<DelegateChanged>(
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

  test('delegate votes - new delegate', () => {
    /** setup tests */
    const delegate = user3;
    const previousBalance = BigInt.fromI64(0);
    const newBalance = BigInt.fromI64(500000000000000000000000000000);
    /** run handler */
    const delegateVotesChangedEvent = createDelegateVotesChangedEvent<DelegateVotesChanged>(
      delegate,
      previousBalance,
      newBalance,
    );
    handleDelegateVotesChanged(delegateVotesChangedEvent);
    const votesDifference = newBalance.minus(previousBalance);
    // Delegate
    const assertDelegateDocument = (key: string, value: string): void => {
      assert.fieldEquals('Delegate', user3.toHex(), key, value);
    };
    assertDelegateDocument('delegatedVotes', newBalance.toString());

    // Governance
    const assertGovernanceDocument = (key: string, value: string): void => {
      assert.fieldEquals('Governance', GOVERNANCE, key, value);
    };
    assertGovernanceDocument('delegatedVotes', originalBalance.plus(votesDifference).toString());
    assertGovernanceDocument('currentDelegates', '1');
  });

  test('delegate votes - lost delegate', () => {
    /** setup tests */
    const delegate = user3;
    const previousBalance = BigInt.fromI64(300000000000000000000000000000);
    const newBalance = BigInt.fromI64(0);
    /** run handler */
    const delegateVotesChangedEvent = createDelegateVotesChangedEvent<DelegateVotesChanged>(
      delegate,
      previousBalance,
      newBalance,
    );
    handleDelegateVotesChanged(delegateVotesChangedEvent);

    const votesDifference = newBalance.minus(previousBalance);
    // Delegate
    const assertDelegateDocument = (key: string, value: string): void => {
      assert.fieldEquals('Delegate', user3.toHex(), key, value);
    };
    assertDelegateDocument('delegatedVotes', newBalance.toString());

    // Governance
    const assertGovernanceDocument = (key: string, value: string): void => {
      assert.fieldEquals('Governance', GOVERNANCE, key, value);
    };
    assertGovernanceDocument('delegatedVotes', originalBalance.plus(votesDifference).toString());
    assertGovernanceDocument('currentDelegates', '-1');
  });
});
