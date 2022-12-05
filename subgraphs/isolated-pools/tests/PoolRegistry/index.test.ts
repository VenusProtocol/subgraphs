import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { priceOracleAddress } from '../../src/constants/addresses';
import { handlePoolNameSet, handlePoolRegistered } from '../../src/mappings/poolRegistry';
import { createPoolRegistryMock } from '../VToken/mocks';
import { createPoolNameSetEvent, createPoolRegisteredEvent } from './events';

const cleanup = (): void => {
  clearStore();
};

beforeEach(() => {
  createPoolRegistryMock([
    [
      ethereum.Value.fromString('Gamer Pool'),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000072')),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000c0c')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9000000)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(6235232)),
    ],
    [
      ethereum.Value.fromString('Gamer Pool1'),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000072')),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000064')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9000000)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(6235232)),
    ],
    [
      ethereum.Value.fromString('Gamer Pool2'),
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
    const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000064');
    const poolRegisteredEvent = createPoolRegisteredEvent(comptrollerAddress);

    handlePoolRegistered(poolRegisteredEvent);
    const assertPoolDocument = (key: string, value: string): void => {
      assert.fieldEquals('Pool', '0x0000000000000000000000000000000000000064', key, value);
    };
    assertPoolDocument('id', comptrollerAddress.toHexString());
    assertPoolDocument('name', 'Gamer Pool1');
    assertPoolDocument('creator', '0x0000000000000000000000000000000000000072');
    assertPoolDocument('blockPosted', '100');
    assertPoolDocument('timestampPosted', '1662990421');
    assertPoolDocument('riskRating', 'HIGH_RISK');
    assertPoolDocument('category', 'Games');
    assertPoolDocument('logoUrl', '/logo.png');
    assertPoolDocument('description', 'Game related tokens');
    assertPoolDocument('priceOracle', priceOracleAddress.toHex());
    assertPoolDocument('closeFactor', '5');
    assertPoolDocument('liquidationIncentive', '7');
    assertPoolDocument('maxAssets', '10');
  });

  test('updates pool name correctly', () => {
    const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000025');
    const poolRegisteredEvent = createPoolRegisteredEvent(comptrollerAddress);

    handlePoolRegistered(poolRegisteredEvent);
    const poolNameSetEvent = createPoolNameSetEvent(comptrollerAddress, 'Summer Pool');

    const assertPoolDocument = (key: string, value: string): void => {
      assert.fieldEquals('Pool', '0x0000000000000000000000000000000000000025', key, value);
    };
    assertPoolDocument('id', comptrollerAddress.toHex());
    assertPoolDocument('name', 'Gamer Pool2');
    handlePoolNameSet(poolNameSetEvent);
    assertPoolDocument('name', 'Summer Pool');
  });
});
