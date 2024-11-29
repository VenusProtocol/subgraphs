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
} from 'matchstick-as/assembly';

import { Pool } from '../../generated/schema';
import { oneBigInt, zeroBigInt32 } from '../../src/constants';
import {
  handleActionPausedMarket,
  handleMarketEntered,
  handleMarketExited,
  handleMarketSupported,
  handleMarketUnlisted,
  handleNewBorrowCap,
  handleNewCloseFactor,
  handleNewCollateralFactor,
  handleNewLiquidationIncentive,
  handleNewLiquidationThreshold,
  handleNewMinLiquidatableCollateral,
  handleNewPriceOracle,
  handleNewRewardsDistributor,
  handleNewSupplyCap,
} from '../../src/mappings/pool';
import { handleMarketAdded, handlePoolRegistered } from '../../src/mappings/poolRegistry';
import { getAccountVTokenId, getMarketActionId } from '../../src/utilities/ids';
import { createPoolRegisteredEvent } from '../PoolRegistry/events';
import { createRewardsDistributorMock } from '../RewardsDistributor/mocks';
import { PoolInfo, createPoolRegistryMock, createVBep20AndUnderlyingMock } from '../VToken/mocks';
import {
  createActionPausedMarketEvent,
  createMarketAddedEvent,
  createMarketEnteredEvent,
  createMarketExitedEvent,
  createMarketSupported,
  createMarketUnlisted,
  createNewBorrowCapEvent,
  createNewCloseFactorEvent,
  createNewCollateralFactorEvent,
  createNewLiquidationIncentiveEvent,
  createNewLiquidationThresholdEvent,
  createNewMinLiquidatableCollateralEvent,
  createNewPriceOracleEvent,
  createNewRewardsDistributor,
  createNewSupplyCapEvent,
} from './events';

const vTokenAddress = Address.fromString('0x0000000000000000000000000000000000000a0a');
const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
const oldAddress = Address.fromString('0x0000000000000000000000000000000000000d0d');
const newAddress = Address.fromString('0x0000000000000000000000000000000000000e0e');

const accountAddress = Address.fromString('0x0000000000000000000000000000000000000d0d');

const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');
const accessControlManagerAddress = Address.fromString(
  '0x45f8a08F534f34A97187626E05d4b6648Eeaa9AA',
);

const rewardsDistributorAddress = Address.fromString('0x082F27894f3E3CbC2790899AEe82D6f149521AFa');

const underlyingPrice = BigInt.fromString('15000000000000000');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  const balanceOfAccount = BigInt.fromI32(100);
  createVBep20AndUnderlyingMock(
    vTokenAddress,
    tokenAddress,
    comptrollerAddress,
    'B0B Coin',
    'B0B',
    BigInt.fromI32(18),
    balanceOfAccount,
    interestRateModelAddress,
    accessControlManagerAddress,
    underlyingPrice,
  );

  createMockedFunction(
    vTokenAddress,
    'getAccountSnapshot',
    'getAccountSnapshot(address):(uint256,uint256,uint256,uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([
      ethereum.Value.fromSignedBigInt(zeroBigInt32),
      ethereum.Value.fromSignedBigInt(balanceOfAccount),
      ethereum.Value.fromSignedBigInt(zeroBigInt32),
      ethereum.Value.fromSignedBigInt(oneBigInt),
    ]);

  createMockedFunction(
    vTokenAddress,
    'borrowBalanceStored',
    'borrowBalanceStored(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(5))]);

  createPoolRegistryMock([
    new PoolInfo(
      'Gamer Pool',
      Address.fromString('0x0000000000000000000000000000000000000072'),
      comptrollerAddress,
    ),
  ]);

  createMockedFunction(comptrollerAddress, 'getAllMarkets', 'getAllMarkets():(address[])').returns([
    ethereum.Value.fromArray([]),
  ]);

  createRewardsDistributorMock(rewardsDistributorAddress, tokenAddress);
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
  test('handle listing a market', () => {
    const marketSupportedEvent = createMarketSupported(vTokenAddress);

    handleMarketSupported(marketSupportedEvent);

    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', vTokenAddress.toHex(), key, value);
    };

    assertMarketDocument('isListed', 'true');
    assertMarketDocument('collateralFactorMantissa', '0');
    assertMarketDocument('liquidationThresholdMantissa', '0');
  });

  test('handle delisting a market', () => {
    const marketUnlistedEvent = createMarketUnlisted(vTokenAddress);

    handleMarketUnlisted(marketUnlistedEvent);

    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', vTokenAddress.toHex(), key, value);
    };

    assertMarketDocument('isListed', 'false');
  });

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

    const accountVTokenId = getAccountVTokenId(vTokenAddress, accountAddress);

    assertAccountDocument('id', accountAddress.toHexString());
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId.toHexString(),
      'id',
      accountVTokenId.toHexString(),
    );
    assert.fieldEquals('AccountVToken', accountVTokenId.toHexString(), 'enteredMarket', 'true');
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId.toHexString(),
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

    const accountVTokenId = getAccountVTokenId(vTokenAddress, accountAddress).toHexString();

    assertAccountDocument('id', accountAddress.toHexString());
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
    assertPoolDocument('closeFactorMantissa', newCloseFactorMantissa.toString());
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
    assertMarketDocument('collateralFactorMantissa', newCollateralFactorMantissa.toString());
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
    assertPoolDocument('liquidationIncentiveMantissa', newLiquidationIncentiveMantissa.toString());
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
    assertPoolDocument('priceOracleAddress', newPriceOracle.toHexString());
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

    const id = getMarketActionId(vTokenAddress, action).toHexString();

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
    assert.fieldEquals(
      'Market',
      vTokenAddress.toHex(),
      'borrowCapMantissa',
      newBorrowCap.toString(),
    );
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
      'minLiquidatableCollateralMantissa',
      newMinLiquidatableCollateral.toString(),
    );
  });

  test('indexes NewSupplyCap event', () => {
    const newSupplyCap = BigInt.fromI64(5000000000000000000);
    const newSupplyCapEvent = createNewSupplyCapEvent(vTokenAddress, newSupplyCap);

    handleNewSupplyCap(newSupplyCapEvent);

    assert.fieldEquals('Market', vTokenAddress.toHex(), 'id', vTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      vTokenAddress.toHex(),
      'supplyCapMantissa',
      newSupplyCap.toString(),
    );
  });

  test('indexes NewLiquidationThreshold event', () => {
    const oldLiquidationThresholdMantissa = BigInt.fromI64(200000000000000000);
    const newLiquidationThresholdMantissa = BigInt.fromI64(200000000000000000);
    const newLiquidationThresholdEvent = createNewLiquidationThresholdEvent(
      vTokenAddress,
      oldLiquidationThresholdMantissa,
      newLiquidationThresholdMantissa,
    );
    handleNewLiquidationThreshold(newLiquidationThresholdEvent);
    assert.fieldEquals('Market', vTokenAddress.toHex(), 'id', vTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      vTokenAddress.toHex(),
      'liquidationThresholdMantissa',
      newLiquidationThresholdMantissa.toString(),
    );
  });

  test('indexes NewRewardsDistributor event', () => {
    const newRewardsDistributorEvent = createNewRewardsDistributor(
      comptrollerAddress,
      rewardsDistributorAddress,
    );

    handleNewRewardsDistributor(newRewardsDistributorEvent);

    assert.fieldEquals(
      'RewardsDistributor',
      rewardsDistributorAddress.toHex(),
      'id',
      rewardsDistributorAddress.toHexString(),
    );
    assert.fieldEquals(
      'RewardsDistributor',
      rewardsDistributorAddress.toHex(),
      'pool',
      comptrollerAddress.toHexString(),
    );

    const pool = Pool.load(comptrollerAddress)!;
    const rewardsDistributors = pool.rewardsDistributors.load();
    assert.bytesEquals(rewardsDistributorAddress, rewardsDistributors[0].id);
  });
});
