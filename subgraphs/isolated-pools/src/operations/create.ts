import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import { PoolLens as PoolLensContract } from '../../generated/PoolRegistry/PoolLens';
import {
  Borrow,
  LiquidateBorrow,
  Mint,
  Redeem,
  RepayBorrow,
  Transfer,
} from '../../generated/PoolRegistry/VToken';
import { Account, Market, Pool, Transaction } from '../../generated/schema';
import { BEP20 as BEP20Contract } from '../../generated/templates/VToken/BEP20';
import { VToken as VTokenContract } from '../../generated/templates/VToken/VToken';
import {
  BORROW,
  LIQUIDATE,
  MINT,
  REDEEM,
  REPAY,
  RiskRatings,
  TRANSFER,
  vTokenDecimals,
  vTokenDecimalsBigDecimal,
  zeroBigDecimal,
} from '../constants';
import { poolLensAddress, poolRegistryAddress } from '../constants/addresses';
import {
  getInterestRateModelAddress,
  getReserveFactorMantissa,
  getUnderlyingAddress,
} from '../utilities';
import exponentToBigDecimal from '../utilities/exponentToBigDecimal';
import { getPoolId, getTransactionEventId } from '../utilities/ids';

export function createPool(comptroller: Address): Pool | null {
  const pool = new Pool(getPoolId(comptroller));
  // Fill in pool from pool lens
  const poolLensContract = PoolLensContract.bind(poolLensAddress);
  const getPoolByComptrollerResult = poolLensContract.try_getPoolByComptroller(
    poolRegistryAddress,
    comptroller,
  );

  if (getPoolByComptrollerResult.reverted) {
    log.error('Unable to fetch pool info for {} with lens {}', [
      comptroller.toHexString(),
      poolLensAddress.toHexString(),
    ]);
  } else {
    const poolDataFromLens = getPoolByComptrollerResult.value;
    pool.name = poolDataFromLens.name;
    pool.creator = poolDataFromLens.creator;
    pool.blockPosted = poolDataFromLens.blockPosted;
    pool.timestampPosted = poolDataFromLens.timestampPosted;
    pool.riskRating = RiskRatings[poolDataFromLens.riskRating];
    pool.category = poolDataFromLens.category;
    pool.logoUrl = poolDataFromLens.logoURL;
    pool.description = poolDataFromLens.description;
    pool.priceOracle = poolDataFromLens.priceOracle;
    pool.closeFactor = poolDataFromLens.closeFactor ? poolDataFromLens.closeFactor : new BigInt(0);
    pool.minLiquidatableCollateral = BigInt.fromI32(0);
    pool.liquidationIncentive = poolDataFromLens.liquidationIncentive
      ? poolDataFromLens.liquidationIncentive
      : new BigInt(0);
    pool.maxAssets = poolDataFromLens.maxAssets ? poolDataFromLens.maxAssets : new BigInt(0);
    // Note: we don't index vTokens here because when a pool is created it has no markets
    pool.save();
    return pool;
  }
  return null;
}

export function createAccount(accountAddress: Address): Account {
  const account = new Account(accountAddress.toHexString());
  account.countLiquidated = 0;
  account.countLiquidator = 0;
  account.hasBorrowed = false;
  account.save();
  return account;
}

export function createMarket(comptroller: Address, vTokenAddress: Address): Market {
  const vTokenContract = VTokenContract.bind(vTokenAddress);
  const underlyingAddress = getUnderlyingAddress(vTokenContract);
  const underlyingContract = BEP20Contract.bind(Address.fromBytes(underlyingAddress));
  const market = new Market(vTokenAddress.toHexString());
  market.pool = comptroller.toHexString();
  market.name = vTokenContract.name();
  market.interestRateModelAddress = getInterestRateModelAddress(vTokenContract);
  market.symbol = vTokenContract.symbol();
  market.underlyingAddress = underlyingAddress;
  market.underlyingName = underlyingContract.name();
  market.underlyingSymbol = underlyingContract.symbol();
  market.underlyingPriceUsd = zeroBigDecimal;
  market.underlyingDecimals = underlyingContract.decimals();

  market.borrowRate = zeroBigDecimal;
  market.cash = zeroBigDecimal;
  market.collateralFactor = zeroBigDecimal;
  market.exchangeRate = zeroBigDecimal;
  market.reserves = zeroBigDecimal;
  market.supplyRate = zeroBigDecimal;
  market.totalBorrows = zeroBigDecimal;
  market.totalSupply = zeroBigDecimal;
  market.underlyingPrice = zeroBigDecimal;
  market.accrualBlockNumber = 0;
  market.blockTimestamp = 0;
  market.borrowIndex = zeroBigDecimal;
  market.reserveFactor = getReserveFactorMantissa(vTokenContract);
  market.borrowCap = BigInt.fromI32(0);
  market.treasuryTotalBorrowsWei = BigInt.fromI32(0);
  market.treasuryTotalSupplyWei = BigInt.fromI32(0);
  market.save();
  return market;
}

export const createMintTransaction = (event: Mint, underlyingDecimals: i32): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);
  const underlyingAmount = event.params.mintAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .truncate(underlyingDecimals);

  const vTokenAmount = event.params.mintTokens
    .toBigDecimal()
    .div(vTokenDecimalsBigDecimal)
    .truncate(vTokenDecimals);

  const transaction = new Transaction(id);
  transaction.type = MINT;
  transaction.amount = vTokenAmount;
  transaction.to = event.params.minter;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.underlyingAmount = underlyingAmount;
  transaction.save();
};

export const createRedeemTransaction = (event: Redeem, underlyingDecimals: i32): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);
  const underlyingAmount = event.params.redeemAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .truncate(underlyingDecimals);

  const vTokenAmount = event.params.redeemTokens
    .toBigDecimal()
    .div(vTokenDecimalsBigDecimal)
    .truncate(vTokenDecimals);

  const transaction = new Transaction(id);
  transaction.type = REDEEM;
  transaction.amount = vTokenAmount;
  transaction.to = event.params.redeemer;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.underlyingAmount = underlyingAmount;
  transaction.save();
};

export const createBorrowTransaction = (event: Borrow, underlyingDecimals: i32): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);
  const borrowAmount = event.params.borrowAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .truncate(underlyingDecimals);

  const accountBorrows = event.params.accountBorrows
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .truncate(underlyingDecimals);

  const transaction = new Transaction(id);
  transaction.type = BORROW;
  transaction.amount = borrowAmount;
  transaction.to = event.params.borrower;
  transaction.accountBorrows = accountBorrows;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
};

export const createRepayBorrowTransaction = (event: RepayBorrow, underlyingDecimals: i32): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);
  const repayAmount = event.params.repayAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .truncate(underlyingDecimals);

  const accountBorrows = event.params.accountBorrows
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .truncate(underlyingDecimals);

  const transaction = new Transaction(id);
  transaction.type = REPAY;
  transaction.amount = repayAmount;
  transaction.to = event.params.borrower;
  transaction.accountBorrows = accountBorrows;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
};

export const createLiquidateBorrowTransaction = (
  event: LiquidateBorrow,
  underlyingDecimals: i32,
): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);
  const amount = event.params.seizeTokens
    .toBigDecimal()
    .div(exponentToBigDecimal(vTokenDecimals))
    .truncate(vTokenDecimals);

  const underlyingRepayAmount = event.params.repayAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingDecimals))
    .truncate(underlyingDecimals);

  const transaction = new Transaction(id);
  transaction.type = LIQUIDATE;
  transaction.amount = amount;
  transaction.to = event.params.borrower;
  transaction.underlyingRepayAmount = underlyingRepayAmount;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
};

export const createTransferTransaction = (event: Transfer): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);
  const amount = event.params.amount.toBigDecimal().div(exponentToBigDecimal(vTokenDecimals));

  const transaction = new Transaction(id);
  transaction.type = TRANSFER;
  transaction.amount = amount;
  transaction.to = event.params.to;
  transaction.from = event.params.from;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
};
