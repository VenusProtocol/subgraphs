import { BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { comptrollerAddress, nullAddress, vBnbAddress } from '../src/constants/addresses';
import { handleMarketListed } from '../src/mappings/comptroller';
import { interestRateModelAddress } from './constants';
import { createMarketListedEvent } from './events';
import { createComptrollerMock, createVBep20AndUnderlyingMock } from './mocks';

const cleanup = (): void => {
  clearStore();
};

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  // Mock BNB
  createVBep20AndUnderlyingMock(
    vBnbAddress,
    nullAddress,
    'BNB',
    'BNB',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
  );

  createComptrollerMock(comptrollerAddress);
});

describe('handleMarketListing', () => {
  test('lists vBNB market correctly', () => {
    const marketListedEvent = createMarketListedEvent(vBnbAddress);

    handleMarketListed(marketListedEvent);
    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', vBnbAddress.toHex(), key, value);
    };
    assertMarketDocument('id', vBnbAddress.toHex());
    assertMarketDocument('underlyingAddress', nullAddress.toHex());
    assertMarketDocument('underlyingDecimals', '18');
    assertMarketDocument('underlyingName', 'Binance Coin');
    assertMarketDocument('underlyingSymbol', 'BNB');
    assertMarketDocument('underlyingPriceCents', '0');
    assertMarketDocument('borrowRateMantissa', '0');
    assertMarketDocument('cashMantissa', '0');
    assertMarketDocument('collateralFactorMantissa', '0');
    assertMarketDocument('exchangeRateMantissa', '0');
    assertMarketDocument('interestRateModelAddress', interestRateModelAddress.toHex());
    assertMarketDocument('name', 'Venus BNB');
    assertMarketDocument('reservesMantissa', '0');
    assertMarketDocument('supplyRateMantissa', '0');
    assertMarketDocument('symbol', 'vBNB');
    assertMarketDocument('totalBorrowsMantissa', '0');
    assertMarketDocument('totalSupplyMantissa', '0');
    assertMarketDocument('accrualBlockNumber', '0');
    assertMarketDocument('blockTimestamp', '0');
    assertMarketDocument('borrowIndexMantissa', '0');
    assertMarketDocument('reserveFactor', '100');
  });
});
