import { BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';
import { vBnbAddress, vUsdcAddress, usdcAddress, nullAddress, interestRateModelAddress } from '../src/constants/addresses'
import { handleMarketListed } from '../src/mappings/comptroller';
import { createMarketListedEvent } from './events';
import { createVBep20AndUnderlyingMock } from './mocks';


const cleanup = (): void => {
  clearStore();
};

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  // Mock USDC
  createVBep20AndUnderlyingMock(
    vUsdcAddress,
    usdcAddress,
    'USD Coin',
    'USDC',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
  );
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
});

describe('handleMarketListing', () => {
  test('lists vUSDC market correctly with underlyingPriceUSD === 1', () => {
    const marketListedEvent = createMarketListedEvent(vUsdcAddress);

    handleMarketListed(marketListedEvent);

    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', vUsdcAddress.toHex(), key, value);
    };
    assertMarketDocument('id', vUsdcAddress.toHex());
    assertMarketDocument('underlyingAddress', usdcAddress.toHex());
    assertMarketDocument('underlyingDecimals', '18');
    assertMarketDocument('underlyingName', 'USD Coin');
    assertMarketDocument('underlyingSymbol', 'USDC');
    assertMarketDocument('underlyingPriceUSD', '1');
    assertMarketDocument('underlyingPrice', '0');
    assertMarketDocument('borrowRate', '0');
    assertMarketDocument('cash', '0');
    assertMarketDocument('collateralFactor', '0');
    assertMarketDocument('exchangeRate', '0');
    assertMarketDocument('interestRateModelAddress', interestRateModelAddress.toHex());
    assertMarketDocument('name', 'Venus USD Coin');
    assertMarketDocument('reserves', '0');
    assertMarketDocument('supplyRate', '0');
    assertMarketDocument('symbol', 'vUSDC');
    assertMarketDocument('totalBorrows', '0');
    assertMarketDocument('totalSupply', '0');
    assertMarketDocument('accrualBlockNumber', '0');
    assertMarketDocument('blockTimestamp', '0');
    assertMarketDocument('borrowIndex', '0');
    assertMarketDocument('reserveFactor', '100');
  });

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
    assertMarketDocument('underlyingPriceUSD', '0');
    assertMarketDocument('underlyingPrice', '1');
    assertMarketDocument('borrowRate', '0');
    assertMarketDocument('cash', '0');
    assertMarketDocument('collateralFactor', '0');
    assertMarketDocument('exchangeRate', '0');
    assertMarketDocument('interestRateModelAddress', interestRateModelAddress.toHex());
    assertMarketDocument('name', 'Venus BNB');
    assertMarketDocument('reserves', '0');
    assertMarketDocument('supplyRate', '0');
    assertMarketDocument('symbol', 'vBNB');
    assertMarketDocument('totalBorrows', '0');
    assertMarketDocument('totalSupply', '0');
    assertMarketDocument('accrualBlockNumber', '0');
    assertMarketDocument('blockTimestamp', '0');
    assertMarketDocument('borrowIndex', '0');
    assertMarketDocument('reserveFactor', '100');
  });
});
