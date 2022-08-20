import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts';
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
  LIQUIDATE_BORROW,
  MINT,
  REDEEM,
  REPAY_BORROW,
  vTokenDecimals,
  vTokenDecimalsBigDecimal,
} from '../../src/constants';
import { handleMarketListed } from '../../src/mappings/pool';
import { handlePoolRegistered } from '../../src/mappings/poolRegistry';
import {
  handleBorrow,
  handleLiquidateBorrow,
  handleMint,
  handleRedeem,
  handleRepayBorrow,
} from '../../src/mappings/vToken';
import { getOrCreateAccountVToken } from '../../src/operations/getOrCreate';
import { readMarket } from '../../src/operations/read';
import exponentToBigDecimal from '../../src/utilities/exponentToBigDecimal';
import { getAccountVTokenId, getTransactionEventId } from '../../src/utilities/ids';
import { createMarketListedEvent } from '../Pool/events';
import { createPoolRegisteredEvent } from '../PoolRegistry/events';
import {
  createBorrowEvent,
  createLiquidateBorrowEvent,
  createMintEvent,
  createRedeemEvent,
  createRepayBorrowEvent,
} from './events';
import { createVBep20AndUnderlyingMock } from './mocks';

const vTokenAddress = Address.fromString('0x0000000000000000000000000000000000000a0a');
const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
const user1Address = Address.fromString('0x0000000000000000000000000000000000000101');
const user2Address = Address.fromString('0x0000000000000000000000000000000000000202');

const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createVBep20AndUnderlyingMock(
    vTokenAddress,
    tokenAddress,
    comptrollerAddress,
    'AAA Coin',
    'AAA',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
  );
});

beforeEach(() => {
  // Create Pool
  const index = new BigInt(0);
  const poolRegisteredEvent = createPoolRegisteredEvent(index, comptrollerAddress);

  handlePoolRegistered(poolRegisteredEvent);
  // Add Market
  const marketListedEvent = createMarketListedEvent(vTokenAddress);

  handleMarketListed(marketListedEvent);
});

afterEach(() => {
  cleanup();
});

describe('VToken', () => {
  test('registers mint event', () => {
    const minter = user1Address;
    const actualMintAmount = BigInt.fromI64(124620530798726345);
    const mintTokens = BigInt.fromI64(37035970026454);
    const mintEvent = createMintEvent(vTokenAddress, minter, actualMintAmount, mintTokens);
    const market = readMarket(vTokenAddress);

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
      vTokenAddress,
      redeemer,
      actualRedeemAmount,
      redeemTokens,
    );
    const market = readMarket(vTokenAddress);

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
      vTokenAddress,
      borrower,
      borrowAmount,
      accountBorrows,
      totalBorrows,
    );

    createMockedFunction(vTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(borrower)])
      .returns([ethereum.Value.fromSignedBigInt(balanceOf)]);

    /** Fire Event */
    handleBorrow(borrowEvent);

    const transactionId = getTransactionEventId(
      borrowEvent.transaction.hash,
      borrowEvent.transactionLogIndex,
    );
    const accountVTokenId = getAccountVTokenId(vTokenAddress, borrower);
    const market = readMarket(vTokenAddress);
    const accountVToken = getOrCreateAccountVToken(market.symbol, borrower, vTokenAddress);
    // Clone the value to remove the reference
    const totalUnderlyingBorrowedOriginal = accountVToken.totalUnderlyingBorrowed.times(
      new BigDecimal(new BigInt(1)),
    );
    const underlyingDecimals = market.underlyingDecimals;
    const totalUnderlyingBorrowed = totalUnderlyingBorrowedOriginal.plus(
      borrowAmount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals)),
    );
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
      'totalUnderlyingBorrowed',
      totalUnderlyingBorrowed.toString(),
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
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'totalUnderlyingBorrowed',
      totalUnderlyingBorrowed.toString(),
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
      vTokenAddress,
      payer,
      borrower,
      repayAmount,
      accountBorrows,
      totalBorrows,
    );

    createMockedFunction(vTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(borrower)])
      .returns([ethereum.Value.fromSignedBigInt(balanceOf)]);

    /** Fire Event */
    handleRepayBorrow(repayBorrowEvent);

    const transactionId = getTransactionEventId(
      repayBorrowEvent.transaction.hash,
      repayBorrowEvent.transactionLogIndex,
    );
    const accountVTokenId = getAccountVTokenId(vTokenAddress, borrower);
    const market = readMarket(vTokenAddress);
    const accountVToken = getOrCreateAccountVToken(market.symbol, borrower, vTokenAddress);
    // Clone the value to remove the reference
    const totalUnderlyingBorrowedOriginal = accountVToken.totalUnderlyingBorrowed.times(
      new BigDecimal(new BigInt(1)),
    );
    const underlyingDecimals = market.underlyingDecimals;
    const totalUnderlyingBorrowed = totalUnderlyingBorrowedOriginal.plus(
      repayAmount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals)),
    );
    const storedBorrowBalance = accountBorrows
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .truncate(underlyingDecimals);

    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', REPAY_BORROW);
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
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'totalUnderlyingBorrowed',
      totalUnderlyingBorrowed.toString(),
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
      vTokenAddress,
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
    const market = readMarket(vTokenAddress);

    const underlyingDecimals = market.underlyingDecimals;
    const underlyingRepayAmount = liquidateBorrowEvent.params.repayAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(underlyingDecimals))
      .truncate(underlyingDecimals);

    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', LIQUIDATE_BORROW);
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
});
