import { Address, BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { zeroBigInt32 } from '../../src/constants';
import {
  handleAccrueInterest,
  handleBorrow,
  handleMint,
  handleTransfer,
} from '../../src/mappings/vToken';
import exponentToBigDecimal from '../../src/utilities/exponentToBigDecimal';
import exponentToBigInt from '../../src/utilities/exponentToBigInt';
import { getPositionId } from '../../src/utilities/ids';
import {
  createAccrueInterestEvent,
  createBorrowEvent,
  createMintEvent,
  createTransferEvent,
} from './events';
import { createAccountVTokenBalanceOfMock, createBep20Mock, createVBep20Mock } from './mocks';

const user1Address = Address.fromString('0x0000000000000000000000000000000000000101');
const user2Address = Address.fromString('0x0000000000000000000000000000000000000202');
const exchangeRateCurrent = BigInt.fromU64(2000000000000000000);
const vTokenAddress = Address.fromString('0xB3A201887396F57bad3fF50DFd02022fE1Fd1774');
const underlyingAddress = Address.fromString('0x3b8b6E96e57f0d1cD366AaCf4CcC68413aF308D0');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createVBep20Mock(vTokenAddress, underlyingAddress, exchangeRateCurrent);
});

afterEach(() => {
  cleanup();
});

describe('VToken', () => {
  test('registers mint event', () => {
    const minter = user1Address;
    const actualMintAmount = BigInt.fromString('10000000000000000000');
    const mintTokens = BigInt.fromString('50000000000000000000');
    const accountBalance = mintTokens;
    const mintEvent = createMintEvent(
      vTokenAddress,
      minter,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );

    handleMint(mintEvent);

    assert.fieldEquals(
      'SupplierAccount',
      getPositionId(minter, vTokenAddress).toHexString(),
      'address',
      minter.toHexString(),
    );
    assert.fieldEquals(
      'SupplierAccount',
      getPositionId(minter, vTokenAddress).toHexString(),
      'effective_balance',
      actualMintAmount.toBigDecimal().div(exponentToBigDecimal(18)).toString(),
    );
  });

  test('registers borrow event', () => {
    /** Constants */
    const borrower = user1Address;
    const borrowAmount = BigInt.fromString('2000000000000000000');
    const accountBorrows = BigInt.fromString('2000000000000000000');
    const totalBorrows = BigInt.fromString('2000000000000000000');

    /** Setup test */
    const borrowEvent = createBorrowEvent(
      vTokenAddress,
      borrower,
      borrowAmount,
      accountBorrows,
      totalBorrows,
    );

    /** Fire Event */
    handleBorrow(borrowEvent);

    assert.fieldEquals(
      'BorrowerAccount',
      getPositionId(borrower, vTokenAddress).toHexString(),
      'address',
      borrower.toHexString(),
    );
    assert.fieldEquals(
      'BorrowerAccount',
      getPositionId(borrower, vTokenAddress).toHexString(),
      'effective_balance',
      accountBorrows.toBigDecimal().div(exponentToBigDecimal(18)).toString(),
    );
  });

  test('registers accrue interest event', () => {
    /** Constants */
    const cashPrior = BigInt.fromString('3000000000000000000');
    const interestAccumulated = BigInt.fromI32(26454);
    const borrowIndex = BigInt.fromI32(1);
    const totalBorrows = BigInt.fromString('80000000000000000000');
    const reserves = BigInt.fromString('2000000000000000000');

    /** Setup test */
    const minter = user1Address;
    const actualMintAmount = BigInt.fromString('10000000000000000000');
    const mintTokens = BigInt.fromString('50000000000000000000');
    const accountBalance = mintTokens;
    const mintEvent = createMintEvent(
      vTokenAddress,
      minter,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );

    handleMint(mintEvent);

    const borrower = user2Address;
    const borrowAmount = BigInt.fromString('2000000000000000000');
    const accountBorrows = BigInt.fromString('4000000000000000000');

    /** Setup test */
    const borrowEvent = createBorrowEvent(
      vTokenAddress,
      borrower,
      borrowAmount,
      accountBorrows,
      totalBorrows,
    );
    createBep20Mock(underlyingAddress, vTokenAddress, cashPrior);
    createAccountVTokenBalanceOfMock(
      vTokenAddress,
      underlyingAddress,
      user1Address,
      zeroBigInt32,
      accountBorrows,
      totalBorrows,
      reserves,
    );
    createAccountVTokenBalanceOfMock(
      vTokenAddress,
      underlyingAddress,
      user2Address,
      zeroBigInt32,
      accountBorrows,
      totalBorrows,
      reserves,
    );

    /** Fire Event */
    handleBorrow(borrowEvent);

    const accrueInterestEvent = createAccrueInterestEvent(
      vTokenAddress,
      cashPrior,
      interestAccumulated,
      borrowIndex,
      totalBorrows,
    );

    /** Fire Event */
    handleAccrueInterest(accrueInterestEvent);

    assert.fieldEquals(
      'SupplierAccount',
      getPositionId(user1Address, vTokenAddress).toHexString(),
      'address',
      user1Address.toHexString(),
    );
    assert.fieldEquals(
      'SupplierAccount',
      getPositionId(user1Address, vTokenAddress).toHexString(),
      'effective_balance',
      '0',
    );

    assert.fieldEquals(
      'BorrowerAccount',
      getPositionId(user2Address, vTokenAddress).toHexString(),
      'address',
      user2Address.toHexString(),
    );
    assert.fieldEquals(
      'BorrowerAccount',
      getPositionId(user2Address, vTokenAddress).toHexString(),
      'effective_balance',
      accountBorrows.toBigDecimal().div(exponentToBigDecimal(18)).toString(),
    );
  });

  test('registers transfer event', () => {
    /** Constants */
    const from = user1Address;
    const to = user2Address;
    const amount = BigInt.fromString('2000000000000000000');
    const actualMintAmount = BigInt.fromString('10000000000000000000');
    const mintTokens = BigInt.fromString('50000000000000000000');
    const accountBalance = mintTokens;
    const mintEvent = createMintEvent(
      vTokenAddress,
      from,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );

    handleMint(mintEvent);

    /** Setup test */
    const transferEvent = createTransferEvent(vTokenAddress, from, to, amount);

    /** Fire Event */
    handleTransfer(transferEvent);

    const underlyingAmount = exchangeRateCurrent.times(amount).div(exponentToBigInt(18));
    assert.fieldEquals(
      'SupplierAccount',
      getPositionId(from, vTokenAddress).toHexString(),
      'address',
      from.toHexString(),
    );
    assert.fieldEquals(
      'SupplierAccount',
      getPositionId(from, vTokenAddress).toHexString(),
      'effective_balance',
      actualMintAmount
        .minus(underlyingAmount)
        .toBigDecimal()
        .div(exponentToBigDecimal(18))
        .toString(),
    );

    assert.fieldEquals(
      'SupplierAccount',
      getPositionId(to, vTokenAddress).toHexString(),
      'address',
      to.toHexString(),
    );
    assert.fieldEquals(
      'SupplierAccount',
      getPositionId(to, vTokenAddress).toHexString(),
      'effective_balance',
      underlyingAmount.toBigDecimal().div(exponentToBigDecimal(18)).toString(),
    );
  });
});
