import { Address, BigInt } from '@graphprotocol/graph-ts';
import { assert, beforeAll, beforeEach, describe, test } from 'matchstick-as/assembly/index';

import { ProposalCreated } from '../../../generated/GovernorBravoDelegate/GovernorBravoDelegate';
import { DelegateChangedV2 } from '../../../generated/XVSVault/XVSVault';
import { handleInitialization } from '../../../src/mappings/alpha';
import { handleProposalCreated } from '../../../src/mappings/bravo';
import {
  handleDelegateChanged,
  handleDeposit,
  handleRequestedWithdrawal,
} from '../../../src/mappings/xvsVault';
import { getOrCreateDelegate } from '../../../src/operations/getOrCreate';
import { user1, user2, user3 } from '../../common/constants';
import { createDelegateChangedEvent, createProposalCreatedEvent } from '../../common/events';
import { createGovernorBravoMocks, createMockBlock } from '../../common/mocks';
import { createXvsDepositEvent, createXvsWithdrawlRequestedEvent } from './events';

const startBlock = 4563820;
const endBlock = 4593820;
const description = 'Very creative Proposal';

beforeAll(() => {
  createGovernorBravoMocks();
});

beforeEach(() => {
  /** setup test */
  handleInitialization(createMockBlock());
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

describe('XVS Vault', () => {
  test('should create new delegate on first deposit', () => {
    const user = Address.fromString('0x0000000000000000000000000000000000000404');
    const amount = '1000000000000000000';
    /** run handler */
    const depositEvent = createXvsDepositEvent(user, BigInt.fromString(amount));
    // Expect delete not to exist
    assert.entityCount('Delegate', 1);

    handleDeposit(depositEvent);

    // Expect value to be updated
    assert.entityCount('Delegate', 2);
    assert.fieldEquals('Delegate', user.toHex(), 'stakedXvsMantissa', amount);
  });

  test("should update delegate's total after withdrawl requested", () => {
    const user = Address.fromString('0x0000000000000000000000000000000000000404');
    const amount = '200000000000000000';
    /** run handler */
    const withdrawRequestedEvent = createXvsWithdrawlRequestedEvent(
      user,
      BigInt.fromString(amount),
    );
    // Expect delete not to exist
    assert.entityCount('Delegate', 2);

    handleRequestedWithdrawal(withdrawRequestedEvent);

    // Expect value to be updated
    assert.entityCount('Delegate', 2);
    assert.fieldEquals('Delegate', user.toHex(), 'stakedXvsMantissa', '800000000000000000');
  });

  test('removes delegate after withdrawing everything', () => {
    const user = Address.fromString('0x0000000000000000000000000000000000000404');
    const amount = '800000000000000000';
    /** run handler */
    const withdrawRequestedEvent = createXvsWithdrawlRequestedEvent(
      user,
      BigInt.fromString(amount),
    );
    // Expect delete not to exist
    assert.entityCount('Delegate', 2);

    handleRequestedWithdrawal(withdrawRequestedEvent);

    // Expect delegate to have been removed
    assert.entityCount('Delegate', 1);
  });

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
    assertOldDelegateDocument('delegateCount', '-1');

    // New Delegate
    const assertNewDelegateDocument = (key: string, value: string): void => {
      assert.fieldEquals('Delegate', user3.toHex(), key, value);
    };
    assertNewDelegateDocument('delegateCount', '1');
  });
});
