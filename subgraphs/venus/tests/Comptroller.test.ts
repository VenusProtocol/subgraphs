import { BigInt, ethereum } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import {
  handleInitialization,
  handleMarketListed,
  handleMarketUnlisted,
  handleNewPriceOracle,
} from '../src/mappings/comptroller';
import {
  comptrollerAddress,
  interestRateModelAddress,
  nativeAddress,
  nullAddress,
  priceOracleAddress,
  vBnbAddress,
} from './constants';
import { createMarketListedEvent } from './events';
import {
  createMockBlock,
  createComptrollerMock,
  createPriceOracleMock,
  createVBep20AndUnderlyingMock,
} from './mocks';
import { createNewPriceOracleEvent } from './events';

const underlyingPrice = BigInt.fromString('15000000000000000');

const cleanup = (): void => {
  clearStore();
};

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  // Mock BNB
  createComptrollerMock([vBnbAddress]);
  createVBep20AndUnderlyingMock(
    vBnbAddress,
    nativeAddress,
    'BNB',
    'BNB',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
    underlyingPrice,
  );

  createPriceOracleMock([[ethereum.Value.fromAddress(vBnbAddress), ethereum.Value.fromI32(99)]]);
});

beforeEach(() => {
  handleInitialization(createMockBlock());
  handleNewPriceOracle(
    createNewPriceOracleEvent(comptrollerAddress, nullAddress, priceOracleAddress),
  );
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
    assertMarketDocument('underlyingAddress', nativeAddress.toHex());
    assertMarketDocument('underlyingDecimals', '18');
    assertMarketDocument('underlyingName', 'BNB');
    assertMarketDocument('underlyingSymbol', 'BNB');
    assertMarketDocument('lastUnderlyingPriceCents', '0');
    assertMarketDocument('lastUnderlyingPriceBlockNumber', '1');
    assertMarketDocument('borrowRateMantissa', '12678493');
    assertMarketDocument('supplyRateMantissa', '12678493');
    assertMarketDocument('cashMantissa', '1418171344423412457');
    assertMarketDocument('collateralFactorMantissa', '0');
    assertMarketDocument('exchangeRateMantissa', '365045823500000000000000');
    assertMarketDocument('interestRateModelAddress', interestRateModelAddress.toHex());
    assertMarketDocument('name', 'Venus BNB');
    assertMarketDocument('reservesMantissa', '0');
    assertMarketDocument('symbol', 'vBNB');
    assertMarketDocument('totalBorrowsMantissa', '0');
    assertMarketDocument('totalSupplyVTokenMantissa', '0');
    assertMarketDocument('accrualBlockNumber', '999');
    assertMarketDocument('borrowIndex', '0');
    assertMarketDocument('reserveFactorMantissa', '100');
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
