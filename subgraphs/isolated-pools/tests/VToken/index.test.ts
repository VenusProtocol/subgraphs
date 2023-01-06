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

import {
  BORROW,
  LIQUIDATE,
  MINT,
  REDEEM,
  REPAY,
  TRANSFER,
  vTokenDecimals,
  vTokenDecimalsBigDecimal,
} from '../../src/constants';
import { vBnbAddress } from '../../src/constants/addresses';
import { handleMarketAdded, handlePoolRegistered } from '../../src/mappings/poolRegistry';
import {
  handleAccrueInterest,
  handleBadDebtIncreased,
  handleBorrow,
  handleLiquidateBorrow,
  handleMint,
  handleNewAccessControlManager,
  handleNewComptroller,
  handleNewMarketInterestRateModel,
  handleNewReserveFactor,
  handleRedeem,
  handleRepayBorrow,
  handleReservesAdded,
  handleReservesReduced,
  handleTransfer,
} from '../../src/mappings/vToken';
import { getMarket } from '../../src/operations/get';
import exponentToBigDecimal from '../../src/utilities/exponentToBigDecimal';
import { getBadDebtEventId } from '../../src/utilities/ids';
import { getAccountVTokenId, getTransactionEventId } from '../../src/utilities/ids';
import { createMarketAddedEvent } from '../Pool/events';
import { createPoolRegisteredEvent } from '../PoolRegistry/events';
import {
  createAccrueInterestEvent,
  createBadDebtIncreasedEvent,
  createBorrowEvent,
  createLiquidateBorrowEvent,
  createMintEvent,
  createNewAccessControlManagerEvent,
  createNewComptrollerEvent,
  createNewMarketInterestRateModelEvent,
  createNewReserveFactorEvent,
  createRedeemEvent,
  createRepayBorrowEvent,
  createReservesAddedEvent,
  createReservesReducedEvent,
  createTransferEvent,
} from './events';
import { createPoolRegistryMock } from './mocks';
import { createMarketMock, createPriceOracleMock, createVBep20AndUnderlyingMock } from './mocks';

const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
const user1Address = Address.fromString('0x0000000000000000000000000000000000000101');
const user2Address = Address.fromString('0x0000000000000000000000000000000000000202');
const aaaTokenAddress = Address.fromString('0x0000000000000000000000000000000000000aaa');

const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createVBep20AndUnderlyingMock(
    aaaTokenAddress,
    tokenAddress,
    comptrollerAddress,
    'AAA Coin',
    'AAA',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
  );

  createMarketMock(aaaTokenAddress);

  createPriceOracleMock([
    [ethereum.Value.fromAddress(vBnbAddress), ethereum.Value.fromI32(326)],
    [ethereum.Value.fromAddress(aaaTokenAddress), ethereum.Value.fromI32(99)],
  ]);

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
  // Create Pool
  const poolRegisteredEvent = createPoolRegisteredEvent(comptrollerAddress);

  handlePoolRegistered(poolRegisteredEvent);
  // Add Market
  const marketAddedEvent = createMarketAddedEvent(comptrollerAddress, aaaTokenAddress);

  handleMarketAdded(marketAddedEvent);
});

afterEach(() => {
  cleanup();
});

describe('VToken', () => {
  test('registers mint event', () => {
    const minter = user1Address;
    const actualMintAmount = BigInt.fromI64(124620530798726345);
    const mintTokens = BigInt.fromI64(37035970026454);
    const mintEvent = createMintEvent(aaaTokenAddress, minter, actualMintAmount, mintTokens);
    const market = getMarket(aaaTokenAddress);

    handleMint(mintEvent);
    const id = getTransactionEventId(mintEvent.transaction.hash, mintEvent.transactionLogIndex);
    assert.fieldEquals('Transaction', id, 'id', id);
    assert.fieldEquals('Transaction', id, 'type', MINT);
    assert.fieldEquals('Transaction', id, 'from', mintEvent.address.toHexString());
    assert.fieldEquals(
      'Transaction',
      id,
      'amount',
      mintTokens.toBigDecimal().div(vTokenDecimalsBigDecimal).truncate(vTokenDecimals).toString(),
    );
    assert.fieldEquals('Transaction', id, 'to', minter.toHexString());
    assert.fieldEquals('Transaction', id, 'blockNumber', mintEvent.block.number.toString());
    assert.fieldEquals('Transaction', id, 'blockTime', mintEvent.block.timestamp.toString());
    assert.fieldEquals(
      'Transaction',
      id,
      'underlyingAmount',
      actualMintAmount
        .toBigDecimal()
        .div(exponentToBigDecimal(market.underlyingDecimals))
        .truncate(market.underlyingDecimals)
        .toString(),
    );
  });

  test('registers redeem event', () => {
    const redeemer = user2Address;
    const actualRedeemAmount = BigInt.fromI64(124620530798726345);
    const redeemTokens = BigInt.fromI64(37035970026454);
    const redeemEvent = createRedeemEvent(
      aaaTokenAddress,
      redeemer,
      actualRedeemAmount,
      redeemTokens,
    );
    const market = getMarket(aaaTokenAddress);

    handleRedeem(redeemEvent);
    const id = getTransactionEventId(redeemEvent.transaction.hash, redeemEvent.transactionLogIndex);
    assert.fieldEquals('Transaction', id, 'id', id);
    assert.fieldEquals('Transaction', id, 'type', REDEEM);
    assert.fieldEquals('Transaction', id, 'from', redeemEvent.address.toHexString());
    assert.fieldEquals(
      'Transaction',
      id,
      'amount',
      redeemTokens.toBigDecimal().div(vTokenDecimalsBigDecimal).truncate(vTokenDecimals).toString(),
    );
    assert.fieldEquals('Transaction', id, 'to', redeemer.toHexString());
    assert.fieldEquals('Transaction', id, 'blockNumber', redeemEvent.block.number.toString());
    assert.fieldEquals('Transaction', id, 'blockTime', redeemEvent.block.timestamp.toString());
    assert.fieldEquals(
      'Transaction',
      id,
      'underlyingAmount',
      actualRedeemAmount
        .toBigDecimal()
        .div(exponentToBigDecimal(market.underlyingDecimals))
        .truncate(market.underlyingDecimals)
        .toString(),
    );
  });

  test('registers borrow event', () => {
    /** Constants */
    const borrower = user1Address;
    const borrowAmount = BigInt.fromI64(1246205398726345);
    const accountBorrows = BigInt.fromI64(35970026454);
    const totalBorrows = BigInt.fromI64(37035970026454);
    const balanceOf = BigInt.fromI64(9937035970026454);

    /** Setup test */
    const borrowEvent = createBorrowEvent(
      aaaTokenAddress,
      borrower,
      borrowAmount,
      accountBorrows,
      totalBorrows,
    );

    createMockedFunction(aaaTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(borrower)])
      .returns([ethereum.Value.fromSignedBigInt(balanceOf)]);

    /** Fire Event */
    handleBorrow(borrowEvent);

    const transactionId = getTransactionEventId(
      borrowEvent.transaction.hash,
      borrowEvent.transactionLogIndex,
    );
    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, borrower);
    const market = getMarket(aaaTokenAddress);
    const underlyingDecimals = market.underlyingDecimals;
    const storedBorrowBalance = accountBorrows
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .truncate(underlyingDecimals);

    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', BORROW);
    assert.fieldEquals('Transaction', transactionId, 'from', borrowEvent.address.toHexString());
    assert.fieldEquals('Transaction', transactionId, 'to', borrower.toHexString());
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockNumber',
      borrowEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockTime',
      borrowEvent.block.timestamp.toString(),
    );

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      borrowEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'storedBorrowBalance',
      storedBorrowBalance.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountBorrowIndex',
      market.borrowIndex.toString(),
    );
  });

  test('registers repay borrow event', () => {
    /** Constants */
    const borrower = user1Address;
    const payer = user1Address;
    const repayAmount = BigInt.fromI64(1246205398726345);
    const accountBorrows = BigInt.fromI64(35970026454);
    const totalBorrows = BigInt.fromI64(37035970026454);
    const balanceOf = BigInt.fromI64(9937035970026454);

    /** Setup test */
    const repayBorrowEvent = createRepayBorrowEvent(
      aaaTokenAddress,
      payer,
      borrower,
      repayAmount,
      accountBorrows,
      totalBorrows,
    );

    createMockedFunction(aaaTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(borrower)])
      .returns([ethereum.Value.fromSignedBigInt(balanceOf)]);

    /** Fire Event */
    handleRepayBorrow(repayBorrowEvent);

    const transactionId = getTransactionEventId(
      repayBorrowEvent.transaction.hash,
      repayBorrowEvent.transactionLogIndex,
    );
    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, borrower);
    const market = getMarket(aaaTokenAddress);
    const underlyingDecimals = market.underlyingDecimals;
    const storedBorrowBalance = accountBorrows
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .truncate(underlyingDecimals);

    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', REPAY);
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'from',
      repayBorrowEvent.address.toHexString(),
    );
    assert.fieldEquals('Transaction', transactionId, 'to', borrower.toHexString());
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockNumber',
      repayBorrowEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockTime',
      repayBorrowEvent.block.timestamp.toString(),
    );

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      repayBorrowEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'storedBorrowBalance',
      storedBorrowBalance.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountBorrowIndex',
      market.borrowIndex.toString(),
    );
  });

  test('registers liquidate borrow event', () => {
    /** Constants */
    const borrower = user1Address;
    const liquidator = user1Address;
    const repayAmount = BigInt.fromI64(1246205398726345);
    const seizeTokens = BigInt.fromI64(37035970026454);
    const vTokenCollateral = tokenAddress;

    /** Setup test */
    const liquidateBorrowEvent = createLiquidateBorrowEvent(
      aaaTokenAddress,
      liquidator,
      borrower,
      repayAmount,
      vTokenCollateral,
      seizeTokens,
    );

    /** Fire Event */
    handleLiquidateBorrow(liquidateBorrowEvent);

    const transactionId = getTransactionEventId(
      liquidateBorrowEvent.transaction.hash,
      liquidateBorrowEvent.transactionLogIndex,
    );
    const market = getMarket(aaaTokenAddress);

    const underlyingDecimals = market.underlyingDecimals;
    const underlyingRepayAmount = liquidateBorrowEvent.params.repayAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .truncate(underlyingDecimals);

    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', LIQUIDATE);
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'from',
      liquidateBorrowEvent.address.toHexString(),
    );
    assert.fieldEquals('Transaction', transactionId, 'to', borrower.toHexString());
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockNumber',
      liquidateBorrowEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockTime',
      liquidateBorrowEvent.block.timestamp.toString(),
    );

    assert.fieldEquals(
      'Transaction',
      transactionId,
      'underlyingRepayAmount',
      underlyingRepayAmount.toString(),
    );
  });

  test('registers accrue interest event', () => {
    /** Constants */
    const cashPrior = BigInt.fromI64(1246205398726345);
    const interestAccumulated = BigInt.fromI64(26454);
    const borrowIndex = BigInt.fromI32(1);
    const totalBorrows = BigInt.fromI64(62197468301);

    /** Setup test */
    const accrueInterestEvent = createAccrueInterestEvent(
      aaaTokenAddress,
      cashPrior,
      interestAccumulated,
      borrowIndex,
      totalBorrows,
    );

    /** Fire Event */
    handleAccrueInterest(accrueInterestEvent);

    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', aaaTokenAddress.toHexString(), key, value);
    };

    assertMarketDocument('accrualBlockNumber', '999');
    assertMarketDocument('blockTimestamp', accrueInterestEvent.block.timestamp.toString());
    assertMarketDocument('treasuryTotalSupplyWei', '36504567163409');
    assertMarketDocument('exchangeRate', '0.000000000320502536');
    assertMarketDocument('borrowIndex', '4.852094820647174144');
    assertMarketDocument('reservesWei', '5128924555022289393');
    assertMarketDocument('treasuryTotalBorrowsWei', '2641234234636158123');
    assertMarketDocument('cash', '1.418171344423412457');
    assertMarketDocument('borrowRate', '0.000000000012678493');
    assertMarketDocument('supplyRate', '0.000000000012678493');
  });

  test('registers new reserve factor', () => {
    const oldReserveFactor = BigInt.fromI64(12462053079875);
    const newReserveFactor = BigInt.fromI64(37035970026454);
    const reserveFactorEvent = createNewReserveFactorEvent(
      aaaTokenAddress,
      oldReserveFactor,
      newReserveFactor,
    );

    handleNewReserveFactor(reserveFactorEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'id', aaaTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHex(),
      'reserveFactor',
      newReserveFactor.toString(),
    );
  });

  test('registers transfer from event', () => {
    /** Constants */
    const from = user1Address; // 101
    const to = aaaTokenAddress;
    const amount = BigInt.fromI64(1246205398726345);
    const balanceOf = BigInt.fromI64(262059874253345);

    /** Setup test */
    const transferEvent = createTransferEvent(aaaTokenAddress, from, to, amount);
    createMockedFunction(aaaTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(from)])
      .returns([ethereum.Value.fromSignedBigInt(balanceOf)]);

    /** Fire Event */
    handleTransfer(transferEvent);

    const transactionId = getTransactionEventId(
      transferEvent.transaction.hash,
      transferEvent.transactionLogIndex,
    );
    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, from);

    /** Transaction */
    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', TRANSFER);
    assert.fieldEquals('Transaction', transactionId, 'from', from.toHexString());
    assert.fieldEquals('Transaction', transactionId, 'to', to.toHexString());
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockNumber',
      transferEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockTime',
      transferEvent.block.timestamp.toString(),
    );
    /** AccountVToken */
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      transferEvent.block.number.toString(),
    );

    assert.fieldEquals('AccountVToken', accountVTokenId, 'accountBorrowIndex', '0');

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'vTokenBalance',
      '262059861791291.01273655',
    );

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'totalUnderlyingRedeemed',
      '0.003994119906686847',
    );
  });

  test('registers transfer to event', () => {
    /** Constants */
    const amount = BigInt.fromI64(5246205398726345);
    const from = aaaTokenAddress;
    const to = user2Address;
    const balanceOf = BigInt.fromI64(262059874253345);

    /** Setup test */
    const transferEvent = createTransferEvent(aaaTokenAddress, from, to, amount);
    createMockedFunction(aaaTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(to)])
      .returns([ethereum.Value.fromSignedBigInt(balanceOf)]);

    /** Fire Event */
    handleTransfer(transferEvent);

    const transactionId = getTransactionEventId(
      transferEvent.transaction.hash,
      transferEvent.transactionLogIndex,
    );
    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, to);

    /** Transaction */
    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', TRANSFER);
    assert.fieldEquals('Transaction', transactionId, 'to', to.toHexString());
    assert.fieldEquals('Transaction', transactionId, 'from', from.toHexString());
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockNumber',
      transferEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockTime',
      transferEvent.block.timestamp.toString(),
    );
    /** AccountVToken */
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      transferEvent.block.number.toString(),
    );

    assert.fieldEquals('AccountVToken', accountVTokenId, 'accountBorrowIndex', '0');

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'vTokenBalance',
      '262059926715398.98726345',
    );
  });

  test('registers new interest rate model', () => {
    const oldInterestRateModel = Address.fromString('0x0000000000000000000000000000000000000e0e');
    const newInterestRateModel = Address.fromString('0x0000000000000000000000000000000000000f0f');
    const newMarketInterestRateModelEvent = createNewMarketInterestRateModelEvent(
      aaaTokenAddress,
      oldInterestRateModel,
      newInterestRateModel,
    );

    handleNewMarketInterestRateModel(newMarketInterestRateModelEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'id', aaaTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHex(),
      'interestRateModelAddress',
      newInterestRateModel.toHexString(),
    );
  });

  test('registers bad debt increased', () => {
    const borrower = Address.fromString('0x0000000000000000000000000000000000000111');
    const badDebtDelta = BigInt.fromI64(300);
    const badDebtOld = BigInt.fromI64(1000);
    const badDebtNew = BigInt.fromI64(700);

    const badDebtIncreasedEvent = createBadDebtIncreasedEvent(
      aaaTokenAddress,
      borrower,
      badDebtDelta,
      badDebtOld,
      badDebtNew,
    );

    const accountVTokenTBadDebtId = getBadDebtEventId(
      badDebtIncreasedEvent.transaction.hash,
      badDebtIncreasedEvent.transaction.index,
    );

    handleBadDebtIncreased(badDebtIncreasedEvent);
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHexString(),
      'badDebtWei',
      badDebtNew.toString(),
    );
    assert.fieldEquals(
      'AccountVTokenBadDebt',
      accountVTokenTBadDebtId,
      'account',
      borrower.toHexString(),
    );
    assert.fieldEquals(
      'AccountVTokenBadDebt',
      accountVTokenTBadDebtId,
      'debtHealed',
      badDebtDelta.toString(),
    );
    assert.fieldEquals(
      'AccountVTokenBadDebt',
      accountVTokenTBadDebtId,
      'timestamp',
      badDebtIncreasedEvent.block.timestamp.toString(),
    );
    assert.fieldEquals(
      'AccountVTokenBadDebt',
      accountVTokenTBadDebtId,
      'block',
      badDebtIncreasedEvent.block.number.toString(),
    );
  });

  test('market registers its new access control manager', () => {
    const oldAccessControlManager = Address.fromString(
      '0x0000000000000000000000000000000000000aaa',
    );
    const newAccessControlManager = Address.fromString(
      '0x0000000000000000000000000000000000000bbb',
    );

    const newAccessControlManagerEvent = createNewAccessControlManagerEvent(
      aaaTokenAddress,
      oldAccessControlManager,
      newAccessControlManager,
    );

    handleNewAccessControlManager(newAccessControlManagerEvent);
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHexString(),
      'accessControlManager',
      newAccessControlManager.toHexString(),
    );
  });

  test('market registers its new comptroller', () => {
    const oldComptroller = Address.fromString('0x0000000000000000000000000000000000000ccc');
    const newComptroller = Address.fromString('0x0000000000000000000000000000000000000ddd');

    const newComptrollerEvent = createNewComptrollerEvent(
      aaaTokenAddress,
      oldComptroller,
      newComptroller,
    );

    handleNewComptroller(newComptrollerEvent);
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHexString(),
      'comptroller',
      newComptroller.toHexString(),
    );
  });

  test('registers market reserve increase', () => {
    const benefactor = Address.fromString('0x0000000000000000000000000000000000000b00');
    const addAmount = BigInt.fromI64(112233445566778899);
    const newTotalReserves = BigInt.fromI64(2222334455667788990);

    const reservesAddedEvent = createReservesAddedEvent(
      aaaTokenAddress,
      benefactor,
      addAmount,
      newTotalReserves,
    );

    handleReservesAdded(reservesAddedEvent);
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHexString(),
      'reservesWei',
      newTotalReserves.toString(),
    );
  });

  test('registers market reserve decrease', () => {
    const benefactor = Address.fromString('0x0000000000000000000000000000000000000b00');
    const reduceAmount = BigInt.fromI64(100000000000000000);
    const newTotalReserves = BigInt.fromI64(9111222333444555666);

    const reservesReducedEvent = createReservesReducedEvent(
      aaaTokenAddress,
      benefactor,
      reduceAmount,
      newTotalReserves,
    );

    handleReservesReduced(reservesReducedEvent);
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHexString(),
      'reservesWei',
      '9111222333444555666',
    );
  });
});
