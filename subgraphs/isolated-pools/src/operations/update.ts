import { Address, BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { exponentToBigDecimal } from '../../../venus/src/mappings/helpers';
import { AccountVToken } from '../../generated/schema';
import {
  getOrCreateAccount,
  getOrCreateAccountVToken,
  getOrCreateAccountVTokenTransaction,
} from './getOrCreate';

const updateAccountVToken = (
  marketAddress: Address,
  marketSymbol: string,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
): AccountVToken => {
  getOrCreateAccount(accountAddress);
  const accountVToken = getOrCreateAccountVToken(
    marketSymbol,
    accountAddress,
    marketAddress,
    false,
  );
  getOrCreateAccountVTokenTransaction(accountAddress, txHash, timestamp, blockNumber, logIndex);
  accountVToken.accrualBlockNumber = blockNumber;
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenBorrow = (
  marketAddress: Address,
  marketSymbol: string,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
  borrowAmount: BigInt,
  accountBorrows: BigInt,
  borrowIndex: BigDecimal,
  underlyingDecimals: i32,
): AccountVToken => {
  const accountVToken = updateAccountVToken(
    marketAddress,
    marketSymbol,
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
  );
  const totalUnderlyingBorrowed = accountVToken.totalUnderlyingBorrowed.plus(
    borrowAmount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals)),
  );
  const storedBorrowBalance = accountBorrows
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .truncate(underlyingDecimals);
  accountVToken.storedBorrowBalance = storedBorrowBalance;
  accountVToken.accountBorrowIndex = borrowIndex;
  accountVToken.totalUnderlyingBorrowed = totalUnderlyingBorrowed;
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenRepayBorrow = (
  marketAddress: Address,
  marketSymbol: string,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
  repayAmount: BigInt,
  accountBorrows: BigInt,
  borrowIndex: BigDecimal,
  underlyingDecimals: i32,
): AccountVToken => {
  const accountVToken = updateAccountVToken(
    marketAddress,
    marketSymbol,
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
  );
  const totalUnderlyingBorrowed = accountVToken.totalUnderlyingBorrowed.plus(
    repayAmount.toBigDecimal().div(exponentToBigDecimal(underlyingDecimals)),
  );
  const storedBorrowBalance = accountBorrows
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .truncate(underlyingDecimals);
  accountVToken.storedBorrowBalance = storedBorrowBalance;
  accountVToken.accountBorrowIndex = borrowIndex;
  accountVToken.totalUnderlyingBorrowed = totalUnderlyingBorrowed;
  accountVToken.save();
  return accountVToken as AccountVToken;
};
