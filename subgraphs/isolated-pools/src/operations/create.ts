import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import { PoolLens as PoolLensContract } from '../../generated/PoolRegistry/PoolLens';
import {
  BadDebtIncreased,
  Borrow,
  LiquidateBorrow,
  Mint,
  Redeem,
  RepayBorrow,
  Transfer,
} from '../../generated/PoolRegistry/VToken';
import {
  Account,
  AccountVTokenBadDebt,
  Market,
  Pool,
  RewardsDistributor,
  Transaction,
  TransactionParams,
} from '../../generated/schema';
import { Comptroller } from '../../generated/templates/Pool/Comptroller';
import { RewardsDistributor as RewardDistributorContract } from '../../generated/templates/RewardsDistributor/RewardsDistributor';
import { BEP20 as BEP20Contract } from '../../generated/templates/VToken/BEP20';
import { VToken as VTokenContract } from '../../generated/templates/VToken/VToken';
import {
  ACCOUNT_BORROWS,
  BORROW,
  LIQUIDATE,
  MINT,
  REDEEM,
  REPAY,
  RiskRatings,
  TRANSFER,
  UNDERLYING_AMOUNT,
  UNDERLYING_REPAY_AMOUNT,
  defaultMantissaFactorBigDecimal,
  mantissaFactor,
  vTokenDecimals,
  vTokenDecimalsBigDecimal,
  zeroBigInt32,
} from '../constants';
import { poolLensAddress, poolRegistryAddress } from '../constants/addresses';
import {
  getInterestRateModelAddress,
  getReserveFactorMantissa,
  getTokenPriceInUsd,
  getUnderlyingAddress,
} from '../utilities';
import exponentToBigDecimal from '../utilities/exponentToBigDecimal';
import {
  getAccountVTokenId,
  getBadDebtEventId,
  getPoolId,
  getRewardsDistributorId,
  getTransactionEventId,
} from '../utilities/ids';

export function createPool(comptroller: Address): Pool {
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
  }
  return pool;
}

export function createAccount(accountAddress: Address): Account {
  const account = new Account(accountAddress.toHexString());
  account.countLiquidated = 0;
  account.countLiquidator = 0;
  account.hasBorrowed = false;
  account.save();
  return account;
}

export function createMarket(
  comptroller: Address,
  vTokenAddress: Address,
  blockTimestamp: BigInt,
): Market {
  const vTokenContract = VTokenContract.bind(vTokenAddress);
  const poolComptroller = Comptroller.bind(comptroller);
  const underlyingAddress = getUnderlyingAddress(vTokenContract);
  const underlyingContract = BEP20Contract.bind(Address.fromBytes(underlyingAddress));
  const market = new Market(vTokenAddress.toHexString());

  market.pool = comptroller.toHexString();

  market.name = vTokenContract.name();
  market.interestRateModelAddress = getInterestRateModelAddress(vTokenContract);
  market.symbol = vTokenContract.symbol();

  const underlyingDecimals = underlyingContract.decimals();
  const underlyingValue = getTokenPriceInUsd(comptroller, vTokenAddress, underlyingDecimals);
  market.underlyingAddress = underlyingAddress;
  market.underlyingName = underlyingContract.name();
  market.underlyingSymbol = underlyingContract.symbol();
  market.underlyingPriceUsd = underlyingValue;
  market.underlyingDecimals = underlyingDecimals;

  market.borrowRate = vTokenContract
    .borrowRatePerBlock()
    .toBigDecimal()
    .div(defaultMantissaFactorBigDecimal)
    .truncate(mantissaFactor);

  market.cash = vTokenContract
    .getCash()
    .toBigDecimal()
    .div(exponentToBigDecimal(market.underlyingDecimals))
    .truncate(market.underlyingDecimals);

  market.exchangeRate = vTokenContract
    .exchangeRateStored()
    .toBigDecimal()
    .div(exponentToBigDecimal(market.underlyingDecimals))
    .times(vTokenDecimalsBigDecimal)
    .div(defaultMantissaFactorBigDecimal)
    .truncate(mantissaFactor);

  market.reservesWei = vTokenContract.totalReserves();
  market.supplyRate = vTokenContract
    .supplyRatePerBlock()
    .toBigDecimal()
    .div(defaultMantissaFactorBigDecimal)
    .truncate(mantissaFactor);

  market.accrualBlockNumber = vTokenContract.accrualBlockNumber().toI32();

  market.blockTimestamp = blockTimestamp.toI32();

  market.borrowIndex = vTokenContract
    .borrowIndex()
    .toBigDecimal()
    .div(defaultMantissaFactorBigDecimal)
    .truncate(mantissaFactor);

  market.reserveFactor = getReserveFactorMantissa(vTokenContract);

  market.treasuryTotalBorrowsWei = vTokenContract.totalBorrows();
  market.treasuryTotalSupplyWei = vTokenContract.totalSupply();

  market.badDebtWei = vTokenContract.badDebt();

  market.supplyCapWei = poolComptroller.supplyCaps(vTokenAddress);
  market.borrowCapWei = poolComptroller.borrowCaps(vTokenAddress);

  // suppliers and borrowers have to be counted through events
  market.supplierCount = zeroBigInt32;
  market.borrowerCount = zeroBigInt32;

  market.collateralFactorMantissa = poolComptroller
    .markets(vTokenAddress)
    .getCollateralFactorMantissa();
  market.liquidationThreshold = poolComptroller
    .markets(vTokenAddress)
    .getLiquidationThresholdMantissa();

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

  const transactionParams = new TransactionParams(id);
  transactionParams.key = UNDERLYING_AMOUNT;
  transactionParams.value = underlyingAmount.toString();
  transactionParams.save();

  transaction.params = transactionParams.id;
  transaction.amount = vTokenAmount;
  transaction.to = event.params.minter;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
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

  const transactionParams = new TransactionParams(id);
  transactionParams.key = UNDERLYING_AMOUNT;
  transactionParams.value = underlyingAmount.toString();
  transactionParams.save();

  transaction.params = transactionParams.id;
  transaction.amount = vTokenAmount;
  transaction.to = event.params.redeemer;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
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

  const transactionParams = new TransactionParams(id);
  transactionParams.key = ACCOUNT_BORROWS;
  transactionParams.value = accountBorrows.toString();
  transactionParams.save();

  transaction.params = transactionParams.id;
  transaction.amount = borrowAmount;
  transaction.to = event.params.borrower;
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

  const transactionParams = new TransactionParams(id);
  transactionParams.key = ACCOUNT_BORROWS;
  transactionParams.value = accountBorrows.toString();
  transactionParams.save();

  transaction.params = transactionParams.id;
  transaction.amount = repayAmount;
  transaction.to = event.params.borrower;
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

  const transactionParams = new TransactionParams(id);
  transactionParams.key = UNDERLYING_REPAY_AMOUNT;
  transactionParams.value = underlyingRepayAmount.toString();
  transactionParams.save();

  transaction.params = transactionParams.id;
  transaction.amount = amount;
  transaction.to = event.params.borrower;
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

export const createAccountVTokenBadDebt = (
  marketAddress: Address,
  event: BadDebtIncreased,
): void => {
  const id = getBadDebtEventId(event.transaction.hash, event.transactionLogIndex);

  const accountVTokenBadDebt = new AccountVTokenBadDebt(id);
  const accountVTokenId = getAccountVTokenId(marketAddress, event.params.borrower);
  accountVTokenBadDebt.account = accountVTokenId;
  accountVTokenBadDebt.block = event.block.number;
  accountVTokenBadDebt.amount = event.params.badDebtDelta;
  accountVTokenBadDebt.timestamp = event.block.timestamp;
  accountVTokenBadDebt.save();
};

export const createRewardDistributor = (
  rewardsDistributorAddress: Address,
  comptrollerAddress: Address,
): void => {
  const rewardDistributorContract = RewardDistributorContract.bind(rewardsDistributorAddress);
  const rewardToken = rewardDistributorContract.rewardToken();
  const id = getRewardsDistributorId(rewardsDistributorAddress);
  const rewardsDistributor = new RewardsDistributor(id);
  rewardsDistributor.pool = comptrollerAddress.toHexString();
  rewardsDistributor.reward = rewardToken;
  rewardsDistributor.save();
};
