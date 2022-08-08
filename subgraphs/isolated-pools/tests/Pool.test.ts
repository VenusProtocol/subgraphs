import { Address, BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { handleMarketListed } from '../src/mappings/pool';
import { createMarketListedEvent } from './events';
import { createVBep20AndUnderlyingMock } from './mocks';

const cTokenAddress = Address.fromString('0x0000000000000000000000000000000000000a0a');
const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');

const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  // Mock USDC
  createVBep20AndUnderlyingMock(
    cTokenAddress,
    tokenAddress,
    comptrollerAddress,
    'B0B Coin',
    'B0B',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
  );
});

afterEach(() => {
  cleanup();
});

describe('Pool Events', () => {
  test('creates Market correctly', () => {
    const marketListedEvent = createMarketListedEvent(cTokenAddress);

    handleMarketListed(marketListedEvent);

    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', cTokenAddress.toHex(), key, value);
    };

    assertMarketDocument('id', cTokenAddress.toHexString());
  });
});
