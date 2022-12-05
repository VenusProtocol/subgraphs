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

import { defaultMantissaFactorBigDecimal } from '../../src/constants/index';
import {
  handleActionPausedMarket,
  handleMarketEntered,
  handleMarketExited,
  handleNewBorrowCap,
  handleNewCloseFactor,
  handleNewCollateralFactor,
  handleNewLiquidationIncentive,
  handleNewMinLiquidatableCollateral,
  handleNewPriceOracle,
} from '../../src/mappings/pool';
import { handleMarketAdded, handlePoolRegistered } from '../../src/mappings/poolRegistry';
import {
  getAccountVTokenId,
  getAccountVTokenTransactionId,
  getMarketActionId,
} from '../../src/utilities/ids';
import { createPoolRegisteredEvent } from '../PoolRegistry/events';
import { createVBep20AndUnderlyingMock } from '../VToken/mocks';
import { createPoolRegistryMock } from '../VToken/mocks';
import {
  createActionPausedMarketEvent,
  createMarketAddedEvent,
  createMarketEnteredEvent,
  createMarketExitedEvent,
  createNewBorrowCapEvent,
  createNewCloseFactorEvent,
  createNewCollateralFactorEvent,
  createNewLiquidationIncentiveEvent,
  createNewMinLiquidatableCollateralEvent,
  createNewPriceOracleEvent,
} from './events';

const vTokenAddress = Address.fromString('0x0000000000000000000000000000000000000a0a');
const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
const oldAddress = Address.fromString('0x0000000000000000000000000000000000000d0d');
const newAddress = Address.fromString('0x0000000000000000000000000000000000000e0e');

const accountAddress = Address.fromString('0x0000000000000000000000000000000000000d0d');

const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createVBep20AndUnderlyingMock(
    vTokenAddress,
    tokenAddress,
    comptrollerAddress,
    'B0B Coin',
    'B0B',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
  );

  createMockedFunction(vTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromI32(100)]);

  createPoolRegistryMock([
    [
      ethereum.Value.fromString('Gamer Pool'),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000072')),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000c0c')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9000000)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(6235232)),
    ],
  ]);
});

beforeEach(() => {
  const poolRegisteredEvent = createPoolRegisteredEvent(comptrollerAddress);

  handlePoolRegistered(poolRegisteredEvent);
  const marketListedEvent = createMarketAddedEvent(comptrollerAddress, vTokenAddress);

  handleMarketAdded(marketListedEvent);
});

afterEach(() => {
  cleanup();
});

describe('Pool Events', () => {
  test('creates Market correctly', () => {
    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', vTokenAddress.toHex(), key, value);
    };

    assertMarketDocument('id', vTokenAddress.toHexString());
  });

  test('indexes Market Entered event', () => {
    const marketEnteredEvent = createMarketEnteredEvent(vTokenAddress, accountAddress);

    handleMarketEntered(marketEnteredEvent);

    const assertAccountDocument = (key: string, value: string): void => {
      assert.fieldEquals('Account', accountAddress.toHex(), key, value);
    };

    const accountVTokenTransactionId = getAccountVTokenTransactionId(
      accountAddress,
      marketEnteredEvent.transaction.hash,
      marketEnteredEvent.logIndex,
    );
    const accountVTokenId = getAccountVTokenId(vTokenAddress, accountAddress);

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
    const marketExitedEvent = createMarketExitedEvent(vTokenAddress, accountAddress);

    handleMarketExited(marketExitedEvent);

    const assertAccountDocument = (key: string, value: string): void => {
      assert.fieldEquals('Account', accountAddress.toHex(), key, value);
    };

    const accountVTokenTransactionId = getAccountVTokenTransactionId(
      accountAddress,
      marketExitedEvent.transaction.hash,
      marketExitedEvent.logIndex,
    );
    const accountVTokenId = getAccountVTokenId(vTokenAddress, accountAddress);

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
    const marketListedEvent = createMarketAddedEvent(comptrollerAddress, vTokenAddress);

    handleMarketAdded(marketListedEvent);

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
    const marketListedEvent = createMarketAddedEvent(comptrollerAddress, vTokenAddress);

    handleMarketAdded(marketListedEvent);

    const oldCollateralFactorMantissa = BigInt.fromI64(900000000000000);
    const newCollateralFactorMantissa = BigInt.fromI64(540000000000000);
    const newCollateralFactorEvent = createNewCollateralFactorEvent(
      vTokenAddress,
      oldCollateralFactorMantissa,
      newCollateralFactorMantissa,
    );

    handleNewCollateralFactor(newCollateralFactorEvent);

    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', vTokenAddress.toHex(), key, value);
    };

    assertMarketDocument('id', vTokenAddress.toHexString());
    assertMarketDocument(
      'collateralFactor',
      newCollateralFactorMantissa.toBigDecimal().div(defaultMantissaFactorBigDecimal).toString(),
    );
  });

  test('indexes NewLiquidationIncentive event', () => {
    const marketListedEvent = createMarketAddedEvent(comptrollerAddress, vTokenAddress);

    handleMarketAdded(marketListedEvent);

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

  test('indexes MarketPauseAction event', () => {
    const action = 0;
    const pauseState = true;
    const marketActionPausedEvent = createActionPausedMarketEvent(
      vTokenAddress,
      action,
      pauseState,
    );

    handleActionPausedMarket(marketActionPausedEvent);

    const id = getMarketActionId(vTokenAddress, action);

    assert.fieldEquals('MarketAction', id, 'id', id);
    assert.fieldEquals('MarketAction', id, 'vToken', vTokenAddress.toHexString());
    assert.fieldEquals('MarketAction', id, 'action', 'MINT');
    assert.fieldEquals('MarketAction', id, 'pauseState', pauseState.toString());
  });

  test('indexes NewBorrowCap event', () => {
    const newBorrowCap = BigInt.fromI64(5000000000000000000);
    const newBorrowCapEvent = createNewBorrowCapEvent(vTokenAddress, newBorrowCap);

    handleNewBorrowCap(newBorrowCapEvent);

    assert.fieldEquals('Market', vTokenAddress.toHex(), 'id', vTokenAddress.toHexString());
    assert.fieldEquals('Market', vTokenAddress.toHex(), 'borrowCap', newBorrowCap.toString());
  });

  test('indexes NewMinLiquidatableCollateral event', () => {
    const newMinLiquidatableCollateral = BigInt.fromI64(200000000000000000);
    const newMinLiquidatableCollateralEvent = createNewMinLiquidatableCollateralEvent(
      comptrollerAddress,
      vTokenAddress,
      newMinLiquidatableCollateral,
    );

    handleNewMinLiquidatableCollateral(newMinLiquidatableCollateralEvent);
    assert.fieldEquals('Pool', comptrollerAddress.toHex(), 'id', comptrollerAddress.toHexString());
    assert.fieldEquals(
      'Pool',
      comptrollerAddress.toHex(),
      'minLiquidatableCollateral',
      newMinLiquidatableCollateral.toString(),
    );
  });
});
