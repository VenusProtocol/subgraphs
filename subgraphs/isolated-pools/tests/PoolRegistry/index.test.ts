import { Address } from '@graphprotocol/graph-ts';
import { afterEach, assert, beforeEach, clearStore, describe, test } from 'matchstick-as/assembly/index';

import { handlePoolNameSet, handlePoolRegistered } from '../../src/mappings/poolRegistry';
import { PoolInfo, createPoolRegistryMock, mockPriceOracleAddress } from '../VToken/mocks';
import { createPoolNameSetEvent, createPoolRegisteredEvent } from './events';

const cleanup = (): void => {
  clearStore();
};

beforeEach(() => {
  createPoolRegistryMock([
    new PoolInfo('Gamer Pool', Address.fromString('0x0000000000000000000000000000000000000072'), Address.fromString('0x0000000000000000000000000000000000000c0c')),
    new PoolInfo('Gamer Pool1', Address.fromString('0x0000000000000000000000000000000000000072'), Address.fromString('0x0000000000000000000000000000000000000064')),
    new PoolInfo('Gamer Pool2', Address.fromString('0x0000000000000000000000000000000000000072'), Address.fromString('0x0000000000000000000000000000000000000025')),
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
    assertPoolDocument('category', 'Games');
    assertPoolDocument('logoUrl', '/logo.png');
    assertPoolDocument('description', 'Game related tokens');
    assertPoolDocument('priceOracleAddress', mockPriceOracleAddress.toHex());
    assertPoolDocument('closeFactorMantissa', '5');
    assertPoolDocument('liquidationIncentiveMantissa', '7');
  });

  test('updates pool name correctly', () => {
    const comptrollerAddressString = '0x0000000000000000000000000000000000000025';
    const comptrollerAddress = Address.fromString(comptrollerAddressString);
    const poolRegisteredEvent = createPoolRegisteredEvent(comptrollerAddress);

    handlePoolRegistered(poolRegisteredEvent);
    const poolNameSetEvent = createPoolNameSetEvent(comptrollerAddress, 'Gamer Pool1', 'Summer Pool');

    const assertPoolDocument = (key: string, value: string): void => {
      assert.fieldEquals('Pool', comptrollerAddressString, key, value);
    };
    assertPoolDocument('id', comptrollerAddress.toHex().toLowerCase());
    assertPoolDocument('name', 'Gamer Pool2');
    handlePoolNameSet(poolNameSetEvent);
    assertPoolDocument('name', 'Summer Pool');
  });
});
