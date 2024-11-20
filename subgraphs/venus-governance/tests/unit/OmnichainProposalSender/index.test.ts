import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { afterEach, assert, beforeAll, beforeEach, clearStore, describe, test } from 'matchstick-as/assembly/index';

import { RemoteProposalStateTransaction } from '../../../generated/schema';
import { nullAddress, omnichainProposalSenderAddress } from '../../../src/constants/addresses';
import {
  handleClearPayload,
  handleExecuteRemoteProposal,
  handleNewAccessControlManager,
  handlePaused,
  handleSetMaxDailyLimit,
  handleSetTrustedRemoteAddress,
  handleStorePayload,
  handleTrustedRemoteRemoved,
  handleUnpaused,
} from '../../../src/mappings/omnichainProposalSender';
import { getRemoteProposalId, getRemoteProposalStateTransactionId, getTrustedRemoteId } from '../../../src/utilities/ids';
import {
  createClearPayloadEvent,
  createExecuteRemoteProposalEvent,
  createNewAccessControlManagerEvent,
  createSetMaxDailyLimitEvent,
  createSetTrustedRemoteAddressEvent,
  createStorePayloadEvent,
  createTrustedRemoteRemovedEvent,
} from './events';
import { createOmnichainProposalSenderMock } from './mocks';

const MOCK_DESTINATION_ADDRESS = Address.fromString('0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1');
const MOCK_CONTRACT_ADDRESS = Address.fromString('0xb2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2');

const createRemoteProposalStateTransaction = (layerZeroChainId: i32, proposalId: BigInt, remoteProposalId: BigInt): RemoteProposalStateTransaction => {
  const key = getRemoteProposalId(layerZeroChainId, proposalId);
  const id = getRemoteProposalStateTransactionId(remoteProposalId);
  const remoteProposalStateTransaction = new RemoteProposalStateTransaction(id);
  remoteProposalStateTransaction.key = key;
  remoteProposalStateTransaction.save();
  return remoteProposalStateTransaction;
};

const cleanup = (): void => {
  clearStore();
};

afterEach(() => {
  cleanup();
  createRemoteProposalStateTransaction(1, BigInt.fromI32(1), BigInt.fromI32(1));
  createRemoteProposalStateTransaction(2, BigInt.fromI32(2), BigInt.fromI32(2));
  createRemoteProposalStateTransaction(2, BigInt.fromI32(3), BigInt.fromI32(3));
});

beforeEach(() => {
  cleanup();
  createRemoteProposalStateTransaction(1, BigInt.fromI32(1), BigInt.fromI32(1));
  createRemoteProposalStateTransaction(2, BigInt.fromI32(2), BigInt.fromI32(2));
  createRemoteProposalStateTransaction(2, BigInt.fromI32(3), BigInt.fromI32(3));
});

beforeAll(() => {
  createOmnichainProposalSenderMock();
});

describe('OmnichainProposalSender events', () => {
  test('handles SetTrustedRemoteAddress event', () => {
    const setTrustedRemoteAddressEvent = createSetTrustedRemoteAddressEvent(21, nullAddress, MOCK_DESTINATION_ADDRESS);
    handleSetTrustedRemoteAddress(setTrustedRemoteAddressEvent);

    const assertTrustedRemoteDocument = (key: string, value: string): void => {
      const id = getTrustedRemoteId(21);
      assert.fieldEquals('TrustedRemote', id.toHexString(), key, value);
    };

    assertTrustedRemoteDocument('layerZeroChainId', '21');
    assertTrustedRemoteDocument('address', MOCK_DESTINATION_ADDRESS.toHexString());
    assertTrustedRemoteDocument('active', 'true');
  });

  test('handles ExecuteRemoteProposal event', () => {
    const executeRemoteProposalEvent = createExecuteRemoteProposalEvent(1, BigInt.fromI32(1), [MOCK_CONTRACT_ADDRESS], [BigInt.fromI32(0)], ['test()'], [Bytes.fromUTF8('')], 0);
    handleExecuteRemoteProposal(executeRemoteProposalEvent);

    const assertRemoteProposalStateTransactionDocument = (key: string, value: string): void => {
      const id = getRemoteProposalStateTransactionId(BigInt.fromI32(1));
      assert.fieldEquals('RemoteProposalStateTransaction', id, key, value);
    };
    // stateTransactionKey
    assertRemoteProposalStateTransactionDocument('executed', executeRemoteProposalEvent.transaction.hash.toHexString());
  });

  test('handles fallback withdraw', () => {
    const executeRemoteProposalEvent = createExecuteRemoteProposalEvent(1, BigInt.fromI32(2), [MOCK_CONTRACT_ADDRESS], [BigInt.fromI32(0)], ['test()'], [Bytes.fromUTF8('')], 0);
    handleExecuteRemoteProposal(executeRemoteProposalEvent);
    const clearPayloadEvent = createClearPayloadEvent(BigInt.fromI32(2), Bytes.fromHexString('0xb4cb5c551a30f6c25d648560408d'), true);
    handleClearPayload(clearPayloadEvent);

    const assertRemoteProposalStateTransactionDocument = (key: string, value: string): void => {
      const id = getRemoteProposalStateTransactionId(BigInt.fromI32(2));
      assert.fieldEquals('RemoteProposalStateTransaction', id, key, value);
    };
    assertRemoteProposalStateTransactionDocument('withdrawn', clearPayloadEvent.transaction.hash.toHexString());
  });

  test('handles retry execution', () => {
    const executeRemoteProposalEvent = createExecuteRemoteProposalEvent(1, BigInt.fromI32(3), [MOCK_CONTRACT_ADDRESS], [BigInt.fromI32(0)], ['test()'], [Bytes.fromUTF8('')], 0);
    handleExecuteRemoteProposal(executeRemoteProposalEvent);
    const clearPayloadEvent = createClearPayloadEvent(BigInt.fromI32(3), Bytes.fromHexString('0xb4cb5c551a30f6c25d648560408d'), false);
    handleClearPayload(clearPayloadEvent);

    const assertRemoteProposalStateTransactionDocument = (key: string, value: string): void => {
      const id = getRemoteProposalStateTransactionId(BigInt.fromI32(3));
      assert.fieldEquals('RemoteProposalStateTransaction', id, key, value);
    };
    assertRemoteProposalStateTransactionDocument('executed', executeRemoteProposalEvent.transaction.hash.toHexString());
  });

  test('handles StorePayload event', () => {
    const storePayloadEvent = createStorePayloadEvent(
      10102,
      BigInt.fromI32(1),
      [Address.fromString('0x4826533B4897376654Bb4d4AD88B7faFD0C98528')],
      [BigInt.fromI32(0)],
      ['setDelay(uint256)'],
      [Bytes.fromI32(3600)],
      0,
      Bytes.fromUTF8(''),
      0,
      Bytes.fromUTF8('Failed'),
    );
    handleStorePayload(storePayloadEvent);

    const assertRemoteProposalStateTransactionDocument = (key: string, value: string): void => {
      const id = getRemoteProposalStateTransactionId(BigInt.fromI32(1));
      assert.fieldEquals('RemoteProposalStateTransaction', id, key, value);
    };
    assertRemoteProposalStateTransactionDocument('stored', storePayloadEvent.transaction.hash.toHexString());
    assertRemoteProposalStateTransactionDocument('failedReason', Bytes.fromUTF8('Failed').toHex());
  });

  test('handles NewAccessControlManager event', () => {
    const newAccessControlManagerEvent = createNewAccessControlManagerEvent(nullAddress, MOCK_CONTRACT_ADDRESS);
    handleNewAccessControlManager(newAccessControlManagerEvent);

    const assertOmnichainProposalSenderDocument = (key: string, value: string): void => {
      assert.fieldEquals('OmnichainProposalSender', omnichainProposalSenderAddress.toHexString(), key, value);
    };
    assertOmnichainProposalSenderDocument('accessControlManagerAddress', MOCK_CONTRACT_ADDRESS.toHexString());
  });

  test('handles Paused event', () => {
    handlePaused();

    const assertOmnichainProposalSenderDocument = (key: string, value: string): void => {
      assert.fieldEquals('OmnichainProposalSender', omnichainProposalSenderAddress.toHexString(), key, value);
    };
    assertOmnichainProposalSenderDocument('paused', 'true');
  });

  test('handles Unpaused event', () => {
    handleUnpaused();

    const assertOmnichainProposalSenderDocument = (key: string, value: string): void => {
      assert.fieldEquals('OmnichainProposalSender', omnichainProposalSenderAddress.toHexString(), key, value);
    };
    assertOmnichainProposalSenderDocument('paused', 'false');
  });

  test('handles SetMaxDailyLimit event', () => {
    const setMaxDailyLimitEvent = createSetMaxDailyLimitEvent(21, 0, 100);
    handleSetMaxDailyLimit(setMaxDailyLimitEvent);

    const assertMaxDailyLimitDocument = (key: string, value: string): void => {
      assert.fieldEquals('MaxDailyLimit', Bytes.fromI32(21).toHex(), key, value);
    };
    assertMaxDailyLimitDocument('destinationChainId', '21');
    assertMaxDailyLimitDocument('max', '100');
  });

  test('handles TrustedRemoteRemoved event', () => {
    const setTrustedRemoteAddressEvent = createSetTrustedRemoteAddressEvent(21, nullAddress, MOCK_DESTINATION_ADDRESS);
    handleSetTrustedRemoteAddress(setTrustedRemoteAddressEvent);
    assert.entityCount('TrustedRemote', 1);
    const trustedRemoteRemovedEvent = createTrustedRemoteRemovedEvent(21);
    handleTrustedRemoteRemoved(trustedRemoteRemovedEvent);
    assert.entityCount('TrustedRemote', 0);
  });
});
