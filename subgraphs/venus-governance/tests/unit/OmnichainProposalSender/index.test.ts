import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

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
import { getProposalId, getTrustedRemoteId } from '../../../src/utilities/ids';
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

const cleanup = (): void => {
  clearStore();
};

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  createOmnichainProposalSenderMock();
});

describe('OmnichainProposalSender events', () => {
  test('handles SetTrustedRemoteAddress event', () => {
    const setTrustedRemoteAddressEvent = createSetTrustedRemoteAddressEvent(
      21,
      nullAddress,
      MOCK_DESTINATION_ADDRESS,
    );
    handleSetTrustedRemoteAddress(setTrustedRemoteAddressEvent);

    const assertTrustedRemoteDocument = (key: string, value: string): void => {
      const id = getTrustedRemoteId(21);
      assert.fieldEquals('TrustedRemote', id.toHexString(), key, value);
    };

    assertTrustedRemoteDocument('chainId', '21');
    assertTrustedRemoteDocument('address', MOCK_DESTINATION_ADDRESS.toHexString());
    assertTrustedRemoteDocument('active', 'true');
  });

  test('handles ExecuteRemoteProposal event', () => {
    const executeRemoteProposalEvent = createExecuteRemoteProposalEvent(
      1,
      BigInt.fromI32(1),
      [MOCK_CONTRACT_ADDRESS],
      [BigInt.fromI32(0)],
      ['test()'],
      [Bytes.fromUTF8('')],
      0,
    );
    handleExecuteRemoteProposal(executeRemoteProposalEvent);

    const assertRemoteProposalDocument = (key: string, value: string): void => {
      const id = getProposalId(BigInt.fromI32(1));
      assert.fieldEquals('RemoteProposal', id, key, value);
    };
    assertRemoteProposalDocument('proposalId', '1');
    assertRemoteProposalDocument('remoteChainId', '1');
    assertRemoteProposalDocument('targets', `[${MOCK_CONTRACT_ADDRESS.toHexString()}]`);
    assertRemoteProposalDocument('values', '[0]');
    assertRemoteProposalDocument('signatures', '[test()]');
    assertRemoteProposalDocument('calldatas', '[0x]');
    assertRemoteProposalDocument('proposalType', '0');
    assertRemoteProposalDocument('status', 'EXECUTED');
  });

  test('handles fallback withdraw', () => {
    const executeRemoteProposalEvent = createExecuteRemoteProposalEvent(
      1,
      BigInt.fromI32(2),
      [MOCK_CONTRACT_ADDRESS],
      [BigInt.fromI32(0)],
      ['test()'],
      [Bytes.fromUTF8('')],
      0,
    );
    handleExecuteRemoteProposal(executeRemoteProposalEvent);
    const clearPayloadEvent = createClearPayloadEvent(
      BigInt.fromI32(2),
      Bytes.fromHexString('0xb4cb5c551a30f6c25d648560408d'),
      true,
    );
    handleClearPayload(clearPayloadEvent);

    const assertRemoteProposalDocument = (key: string, value: string): void => {
      const id = getProposalId(BigInt.fromI32(2));
      assert.fieldEquals('RemoteProposal', id, key, value);
    };
    assertRemoteProposalDocument('status', 'WITHDRAWN');
  });

  test('handles retry execution', () => {
    const executeRemoteProposalEvent = createExecuteRemoteProposalEvent(
      1,
      BigInt.fromI32(3),
      [MOCK_CONTRACT_ADDRESS],
      [BigInt.fromI32(0)],
      ['test()'],
      [Bytes.fromUTF8('')],
      0,
    );
    handleExecuteRemoteProposal(executeRemoteProposalEvent);
    const clearPayloadEvent = createClearPayloadEvent(
      BigInt.fromI32(3),
      Bytes.fromHexString('0xb4cb5c551a30f6c25d648560408d'),
      false,
    );
    handleClearPayload(clearPayloadEvent);
    const assertRemoteProposalDocument = (key: string, value: string): void => {
      const id = getProposalId(BigInt.fromI32(3));
      assert.fieldEquals('RemoteProposal', id, key, value);
    };
    assertRemoteProposalDocument('status', 'EXECUTED');
  });

  test('handles StorePayload event', () => {
    const storePayloadEvent = createStorePayloadEvent(
      13,
      BigInt.fromI32(4),
      [MOCK_CONTRACT_ADDRESS],
      [BigInt.fromI32(0)],
      ['test()'],
      [Bytes.fromUTF8('')],
      0,
      Bytes.fromUTF8(''),
      0,
      Bytes.fromUTF8('Failed'),
    );
    handleStorePayload(storePayloadEvent);
    const assertRemoteProposalDocument = (key: string, value: string): void => {
      const id = getProposalId(BigInt.fromI32(4));
      assert.fieldEquals('RemoteProposal', id, key, value);
    };
    assertRemoteProposalDocument('status', 'STORED');

    assertRemoteProposalDocument('failedReason', Bytes.fromUTF8('Failed').toHex());
  });

  test('handles NewAccessControlManager event', () => {
    const newAccessControlManagerEvent = createNewAccessControlManagerEvent(
      nullAddress,
      MOCK_CONTRACT_ADDRESS,
    );
    handleNewAccessControlManager(newAccessControlManagerEvent);

    const assertOmnichainProposalSenderDocument = (key: string, value: string): void => {
      assert.fieldEquals(
        'OmnichainProposalSender',
        omnichainProposalSenderAddress.toHexString(),
        key,
        value,
      );
    };
    assertOmnichainProposalSenderDocument(
      'accessControlManagerAddress',
      MOCK_CONTRACT_ADDRESS.toHexString(),
    );
  });

  test('handles Paused event', () => {
    handlePaused();

    const assertOmnichainProposalSenderDocument = (key: string, value: string): void => {
      assert.fieldEquals(
        'OmnichainProposalSender',
        omnichainProposalSenderAddress.toHexString(),
        key,
        value,
      );
    };
    assertOmnichainProposalSenderDocument('paused', 'true');
  });

  test('handles Unpaused event', () => {
    handleUnpaused();

    const assertOmnichainProposalSenderDocument = (key: string, value: string): void => {
      assert.fieldEquals(
        'OmnichainProposalSender',
        omnichainProposalSenderAddress.toHexString(),
        key,
        value,
      );
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
    const setTrustedRemoteAddressEvent = createSetTrustedRemoteAddressEvent(
      21,
      nullAddress,
      MOCK_DESTINATION_ADDRESS,
    );
    handleSetTrustedRemoteAddress(setTrustedRemoteAddressEvent);
    assert.entityCount('TrustedRemote', 1);
    const trustedRemoteRemovedEvent = createTrustedRemoteRemovedEvent(21);
    handleTrustedRemoteRemoved(trustedRemoteRemovedEvent);
    assert.entityCount('TrustedRemote', 0);
  });
});
