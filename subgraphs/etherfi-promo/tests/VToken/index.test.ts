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
import { vWeEthAddress, weEthAddress } from '../../src/constants/addresses';
import {
  handleAccrueInterest,
  handleBorrow,
  handleMint,
  handleRedeem,
  handleRepayBorrow,
  handleTransfer,
} from '../../src/mappings/vToken';
import exponentToBigInt from '../../src/utilities/exponentToBigInt';
import {
  createAccrueInterestEvent,
  createBorrowEvent,
  createMintEvent,
  createRedeemEvent,
  createRepayBorrowEvent,
  createTransferEvent,
} from './events';
import { createAccountVTokenBalanceOfMock, createBep20Mock, createVBep20Mock } from './mocks';

const user1Address = Address.fromString('0x0000000000000000000000000000000000000101');
const user2Address = Address.fromString('0x0000000000000000000000000000000000000202');
const exchangeRateCurrent = BigInt.fromU64(2000000000000000000);
const vTokenAddress = vWeEthAddress;
const underlyingAddress = weEthAddress;

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createVBep20Mock(vTokenAddress, exchangeRateCurrent);
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

    assert.fieldEquals('SupplierAccount', minter.toHexString(), 'address', minter.toHexString());
    assert.fieldEquals(
      'SupplierAccount',
      minter.toHexString(),
      'effective_balance',
      actualMintAmount.toString(),
    );
  });

  test('registers redeem event', () => {
    /** Constants */
    const redeemer = user2Address;
    const actualRedeemAmount = BigInt.fromString('5000000000000000000');
    const redeemTokens = BigInt.fromString('25000000000000000000');
    const accountBalance = zeroBigInt32;
    /** Setup test */
    const redeemEvent = createRedeemEvent(
      vTokenAddress,
      redeemer,
      actualRedeemAmount,
      redeemTokens,
      accountBalance,
    );
    const mintEvent = createMintEvent(
      vTokenAddress,
      redeemer,
      actualRedeemAmount,
      redeemTokens,
      accountBalance,
    );

    handleMint(mintEvent);

    /** Fire Event */
    handleRedeem(redeemEvent);
    assert.fieldEquals(
      'SupplierAccount',
      redeemer.toHexString(),
      'address',
      redeemer.toHexString(),
    );
    assert.fieldEquals('SupplierAccount', redeemer.toHexString(), 'effective_balance', '0');
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
      borrower.toHexString(),
      'address',
      borrower.toHexString(),
    );
    assert.fieldEquals(
      'BorrowerAccount',
      borrower.toHexString(),
      'effective_balance',
      accountBorrows.toString(),
    );
  });

  test('registers repay borrow event', () => {
    /** Constants */
    const borrower = user1Address;
    const payer = user1Address;
    const borrowAmount = BigInt.fromString('2000000000000000000');
    const accountBorrows = BigInt.fromString('4000000000000000000');
    const totalBorrows = BigInt.fromString('80000000000000000000');

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
    const repayBorrowEvent = createRepayBorrowEvent(
      vTokenAddress,
      payer,
      borrower,
      borrowAmount,
      accountBorrows,
      totalBorrows,
    );

    /** Fire Event */
    handleRepayBorrow(repayBorrowEvent);

    assert.fieldEquals(
      'BorrowerAccount',
      borrower.toHexString(),
      'address',
      borrower.toHexString(),
    );
    assert.fieldEquals(
      'BorrowerAccount',
      borrower.toHexString(),
      'effective_balance',
      accountBorrows.toString(),
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
      user1Address,
      zeroBigInt32,
      accountBorrows,
      totalBorrows,
      reserves,
    );
    createAccountVTokenBalanceOfMock(
      vTokenAddress,
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
      user1Address.toHexString(),
      'address',
      user1Address.toHexString(),
    );
    assert.fieldEquals('SupplierAccount', user1Address.toHexString(), 'effective_balance', '0');

    assert.fieldEquals(
      'BorrowerAccount',
      user2Address.toHexString(),
      'address',
      user2Address.toHexString(),
    );
    assert.fieldEquals(
      'BorrowerAccount',
      user2Address.toHexString(),
      'effective_balance',
      accountBorrows.toString(),
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
    assert.fieldEquals('SupplierAccount', from.toHexString(), 'address', from.toHexString());
    assert.fieldEquals(
      'SupplierAccount',
      from.toHexString(),
      'effective_balance',
      actualMintAmount.minus(underlyingAmount).toString(),
    );

    assert.fieldEquals('SupplierAccount', to.toHexString(), 'address', to.toHexString());
    assert.fieldEquals(
      'SupplierAccount',
      to.toHexString(),
      'effective_balance',
      underlyingAmount.toString(),
    );
  });
});
