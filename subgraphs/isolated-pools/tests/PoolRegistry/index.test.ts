import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { handlePoolNameSet, handlePoolRegistered } from '../../src/mappings/poolRegistry';
import { createPoolRegistryMock } from '../VToken/mocks';
import { createPoolNameSetEvent, createPoolRegisteredEvent } from './events';

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createPoolRegistryMock([
    [
      ethereum.Value.fromString('Gamer Pool'),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000072')),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000c0c')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9000000)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(6235232)),
    ],
    [
      ethereum.Value.fromString('Gamer Pool'),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000072')),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000064')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9000000)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(6235232)),
    ],
    [
      ethereum.Value.fromString('Gamer Pool'),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000072')),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000025')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9000000)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(6235232)),
    ],
  ]);
});

afterEach(() => {
  cleanup();
});

describe('Pool Registry', () => {
  test('registers pool correctly', () => {
    const index = new BigInt(0);
    const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000064');
    const poolRegisteredEvent = createPoolRegisteredEvent(index, comptrollerAddress);

    handlePoolRegistered(poolRegisteredEvent);
    const assertPoolDocument = (key: string, value: string): void => {
      assert.fieldEquals('Pool', '0x0000000000000000000000000000000000000064', key, value);
    };
    assertPoolDocument('id', comptrollerAddress.toHex());
  });

  test('updates pool name correctly', () => {
    const index = new BigInt(1);
    const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000025');
    const poolRegisteredEvent = createPoolRegisteredEvent(index, comptrollerAddress);

    handlePoolRegistered(poolRegisteredEvent);
    const poolNameSetEvent = createPoolNameSetEvent(index, 'Summer Pool');

    const assertPoolDocument = (key: string, value: string): void => {
      assert.fieldEquals('Pool', '0x0000000000000000000000000000000000000025', key, value);
    };
    assertPoolDocument('id', comptrollerAddress.toHex());

    // assertPoolDocument('name', 'Gamer Pool');
    handlePoolNameSet(poolNameSetEvent);
    assertPoolDocument('name', 'Summer Pool');
  });
});
