import { BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { handleMarketListed, handleMarketUnlisted } from '../src/mappings/comptroller';
import { interestRateModelAddress, nullAddress, vBnbAddress } from './constants';
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

  createComptrollerMock();
});

describe('handleMarketListing', () => {
  test('lists vBNB market correctly', () => {
    const marketListedEvent = createMarketListedEvent(vBnbAddress);

    handleMarketListed(marketListedEvent);
    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', vBnbAddress.toHex(), key, value);
    };
    assertMarketDocument('id', vBnbAddress.toHex());
    assertMarketDocument('isListed', 'true');
    assertMarketDocument('underlyingAddress', nullAddress.toHex());
    assertMarketDocument('underlyingDecimals', '18');
    assertMarketDocument('underlyingName', 'BNB');
    assertMarketDocument('underlyingSymbol', 'BNB');
    assertMarketDocument('lastUnderlyingPriceCents', '0');
    assertMarketDocument('lastUnderlyingPriceBlockNumber', '1');
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
    assertMarketDocument('totalSupplyVTokenMantissa', '0');
    assertMarketDocument('accrualBlockNumber', '100');
    assertMarketDocument('blockTimestamp', '1');
    assertMarketDocument('borrowIndex', '0');
    assertMarketDocument('reserveFactor', '100');
    assertMarketDocument('xvsBorrowStateIndex', '1000000000000000000000000000000000000');
    assertMarketDocument('xvsSupplyStateIndex', '1000000000000000000000000000000000000');
    assertMarketDocument('xvsBorrowStateBlock', '1');
    assertMarketDocument('xvsSupplyStateBlock', '1');
  });

  test('unlist vBNB market correctly', () => {
    const marketListedEvent = createMarketListedEvent(vBnbAddress);
    handleMarketListed(marketListedEvent);

    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', vBnbAddress.toHex(), key, value);
    };
    assertMarketDocument('id', vBnbAddress.toHex());
    assertMarketDocument('isListed', 'true');

    const marketUnlistedEvent = createMarketListedEvent(vBnbAddress);
    handleMarketUnlisted(marketUnlistedEvent);

    assertMarketDocument('id', vBnbAddress.toHex());
    assertMarketDocument('isListed', 'false');
    assertMarketDocument('collateralFactorMantissa', '0');
    assertMarketDocument('xvsBorrowStateIndex', '1000000000000000000000000000000000000');
    assertMarketDocument('xvsSupplyStateIndex', '1000000000000000000000000000000000000');
    assertMarketDocument('xvsBorrowStateBlock', '1');
    assertMarketDocument('xvsSupplyStateBlock', '1');
  });
});
