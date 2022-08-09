import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';
import {
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { defaultMantissaFactorBigDecimal } from '../src/constants';
import {
  handleMarketActionPaused,
  handleMarketEntered,
  handleMarketExited,
  handleMarketListed,
  handleNewBorrowCap,
  handleNewCloseFactor,
  handleNewCollateralFactor,
  handleNewLiquidationIncentive,
  handleNewMinLiquidatableAmount,
  handleNewPauseGuardian,
  handleNewPriceOracle,
  handlePoolActionPaused,
} from '../src/mappings/pool';
import { handlePoolRegistered } from '../src/mappings/poolRegistry';
import {
  getAccountVTokenId,
  getAccountVTokenTransactionId,
  getMarketActionId,
  getPoolActionId,
} from '../src/utilities/ids';
import {
  createMarketActionPausedEvent,
  createMarketEnteredEvent,
  createMarketExitedEvent,
  createMarketListedEvent,
  createNewBorrowCapEvent,
  createNewCloseFactorEvent,
  createNewCollateralFactorEvent,
  createNewLiquidationIncentiveEvent,
  createNewMinLiquidatableAmountEvent,
  createNewPauseGuardianEvent,
  createNewPriceOracleEvent,
  createPoolActionPausedEvent,
  createPoolRegisteredEvent,
} from './events';
import { createVBep20AndUnderlyingMock } from './mocks';

const cTokenAddress = Address.fromString('0x0000000000000000000000000000000000000a0a');
const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
const oldAddress = Address.fromString('0x0000000000000000000000000000000000000d0d');
const newAddress = Address.fromString('0x0000000000000000000000000000000000000e0e');
const poolAddress = Address.fromString('0x0000000000000000000000000000000000000f0f');

const accountAddress = Address.fromString('0x0000000000000000000000000000000000000d0d');

const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
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

  createMockedFunction(cTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromI32(100)]);
});

beforeEach(() => {
  const index = new BigInt(0);
  const poolRegisteredEvent = createPoolRegisteredEvent(index, comptrollerAddress);

  handlePoolRegistered(poolRegisteredEvent);
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

  test('indexes Market Entered event', () => {
    const marketEnteredEvent = createMarketEnteredEvent(cTokenAddress, accountAddress);

    handleMarketEntered(marketEnteredEvent);

    const assertAccountDocument = (key: string, value: string): void => {
      assert.fieldEquals('Account', accountAddress.toHex(), key, value);
    };

    const accountVTokenTransactionId = getAccountVTokenTransactionId(
      accountAddress,
      marketEnteredEvent.transaction.hash,
      marketEnteredEvent.logIndex,
    );
    const accountVTokenId = getAccountVTokenId(cTokenAddress, accountAddress);

    assertAccountDocument('id', accountAddress.toHexString());
    assert.fieldEquals(
      'AccountVTokenTransaction',
      accountVTokenTransactionId,
      'id',
      accountVTokenTransactionId,
    );
    assert.fieldEquals('AccountVToken', accountVTokenId, 'id', accountVTokenId);
    assert.fieldEquals('AccountVToken', accountVTokenId, 'enteredMarket', 'true');
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      marketEnteredEvent.block.number.toString(),
    );
  });

  test('indexes Market Exited event', () => {
    const marketExitedEvent = createMarketExitedEvent(cTokenAddress, accountAddress);

    handleMarketExited(marketExitedEvent);

    const assertAccountDocument = (key: string, value: string): void => {
      assert.fieldEquals('Account', accountAddress.toHex(), key, value);
    };

    const accountVTokenTransactionId = getAccountVTokenTransactionId(
      accountAddress,
      marketExitedEvent.transaction.hash,
      marketExitedEvent.logIndex,
    );
    const accountVTokenId = getAccountVTokenId(cTokenAddress, accountAddress);

    assertAccountDocument('id', accountAddress.toHexString());
    assert.fieldEquals(
      'AccountVTokenTransaction',
      accountVTokenTransactionId,
      'id',
      accountVTokenTransactionId,
    );
    assert.fieldEquals('AccountVToken', accountVTokenId, 'id', accountVTokenId);
    assert.fieldEquals('AccountVToken', accountVTokenId, 'enteredMarket', 'false');
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      marketExitedEvent.block.number.toString(),
    );
  });

  test('indexes NewCloseFactor event', () => {
    const marketListedEvent = createMarketListedEvent(cTokenAddress);

    handleMarketListed(marketListedEvent);

    const oldCloseFactorMantissa = BigInt.fromI64(900000000);
    const newCloseFactorMantissa = BigInt.fromI64(540000000);
    const newCloseFactorEvent = createNewCloseFactorEvent(
      comptrollerAddress,
      oldCloseFactorMantissa,
      newCloseFactorMantissa,
    );

    handleNewCloseFactor(newCloseFactorEvent);
    const assertPoolDocument = (key: string, value: string): void => {
      assert.fieldEquals('Pool', comptrollerAddress.toHex(), key, value);
    };

    assertPoolDocument('id', comptrollerAddress.toHexString());
    assertPoolDocument('closeFactor', newCloseFactorMantissa.toString());
  });

  test('indexes NewCollateralFactor event', () => {
    const marketListedEvent = createMarketListedEvent(cTokenAddress);

    handleMarketListed(marketListedEvent);

    const oldCollateralFactorMantissa = BigInt.fromI64(900000000000000);
    const newCollateralFactorMantissa = BigInt.fromI64(540000000000000);
    const newCollateralFactorEvent = createNewCollateralFactorEvent(
      cTokenAddress,
      oldCollateralFactorMantissa,
      newCollateralFactorMantissa,
    );

    handleNewCollateralFactor(newCollateralFactorEvent);

    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', cTokenAddress.toHex(), key, value);
    };

    assertMarketDocument('id', cTokenAddress.toHexString());
    assertMarketDocument(
      'collateralFactor',
      newCollateralFactorMantissa.toBigDecimal().div(defaultMantissaFactorBigDecimal).toString(),
    );
  });

  test('indexes NewLiquidationIncentive event', () => {
    const marketListedEvent = createMarketListedEvent(cTokenAddress);

    handleMarketListed(marketListedEvent);

    const oldLiquidationIncentiveMantissa = BigInt.fromI64(900000000);
    const newLiquidationIncentiveMantissa = BigInt.fromI64(540000000);
    const newLiquidationIncentiveEvent = createNewLiquidationIncentiveEvent(
      comptrollerAddress,
      oldLiquidationIncentiveMantissa,
      newLiquidationIncentiveMantissa,
    );

    handleNewLiquidationIncentive(newLiquidationIncentiveEvent);

    const assertPoolDocument = (key: string, value: string): void => {
      assert.fieldEquals('Pool', comptrollerAddress.toHex(), key, value);
    };

    assertPoolDocument('id', comptrollerAddress.toHexString());
    assertPoolDocument('liquidationIncentive', newLiquidationIncentiveMantissa.toString());
  });

  test('indexes NewPriceOracle event', () => {
    const oldPriceOracle = oldAddress;
    const newPriceOracle = newAddress;
    const newPriceOracleEvent = createNewPriceOracleEvent(
      comptrollerAddress,
      oldPriceOracle,
      newPriceOracle,
    );

    handleNewPriceOracle(newPriceOracleEvent);

    const assertPoolDocument = (key: string, value: string): void => {
      assert.fieldEquals('Pool', comptrollerAddress.toHex(), key, value);
    };

    assertPoolDocument('id', comptrollerAddress.toHexString());
    assertPoolDocument('priceOracle', newPriceOracle.toHexString());
  });

  test('indexes NewPauseGuardian event', () => {
    const oldPauseGuardian = oldAddress;
    const newPauseGuardian = newAddress;
    const newPauseGuardianEvent = createNewPauseGuardianEvent(
      comptrollerAddress,
      oldPauseGuardian,
      newPauseGuardian,
    );

    handleNewPauseGuardian(newPauseGuardianEvent);

    const assertPoolDocument = (key: string, value: string): void => {
      assert.fieldEquals('Pool', comptrollerAddress.toHex(), key, value);
    };

    assertPoolDocument('id', comptrollerAddress.toHexString());
    assertPoolDocument('pauseGuardian', newPauseGuardian.toHexString());
  });

  test('indexes PoolPauseAction event', () => {
    const action = 'Transfer';
    const pauseState = true;
    const poolActionPausedEvent = createPoolActionPausedEvent(poolAddress, action, pauseState);

    handlePoolActionPaused(poolActionPausedEvent);

    const id = getPoolActionId(poolAddress, action);

    assert.fieldEquals('PoolAction', id, 'id', id);
    assert.fieldEquals('PoolAction', id, 'pool', poolAddress.toHexString());
    assert.fieldEquals('PoolAction', id, 'action', action);
    assert.fieldEquals('PoolAction', id, 'pauseState', pauseState.toString());
  });

  test('indexes MarketPauseAction event', () => {
    const action = 'Mint';
    const pauseState = true;
    const marketActionPausedEvent = createMarketActionPausedEvent(
      cTokenAddress,
      action,
      pauseState,
    );

    handleMarketActionPaused(marketActionPausedEvent);

    const id = getMarketActionId(cTokenAddress, action);

    assert.fieldEquals('MarketAction', id, 'id', id);
    assert.fieldEquals('MarketAction', id, 'cToken', cTokenAddress.toHexString());
    assert.fieldEquals('MarketAction', id, 'action', action);
    assert.fieldEquals('MarketAction', id, 'pauseState', pauseState.toString());
  });

  test('indexes NewBorrowCap event', () => {
    const newBorrowCap = BigInt.fromI64(5000000000000000000);
    const newBorrowCapEvent = createNewBorrowCapEvent(cTokenAddress, newBorrowCap);

    handleNewBorrowCap(newBorrowCapEvent);

    assert.fieldEquals('Market', cTokenAddress.toHex(), 'id', cTokenAddress.toHexString());
    assert.fieldEquals('Market', cTokenAddress.toHex(), 'borrowCap', newBorrowCap.toString());
  });

  test('indexes NewMinLiquidatableAmount event', () => {
    const newMinLiquidatableAmount = BigInt.fromI64(200000000000000000);
    const newMinLiquidatableAmountEvent = createNewMinLiquidatableAmountEvent(
      cTokenAddress,
      newMinLiquidatableAmount,
    );

    handleNewMinLiquidatableAmount(newMinLiquidatableAmountEvent);

    assert.fieldEquals('Market', cTokenAddress.toHex(), 'id', cTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      cTokenAddress.toHex(),
      'minLiquidatableAmount',
      newMinLiquidatableAmount.toString(),
    );
  });
});
