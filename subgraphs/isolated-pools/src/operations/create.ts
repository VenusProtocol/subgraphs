import { Address, BigInt } from '@graphprotocol/graph-ts';

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
} from '../../generated/schema';
import { Comptroller } from '../../generated/templates/Pool/Comptroller';
import { RewardsDistributor as RewardDistributorContract } from '../../generated/templates/RewardsDistributor/RewardsDistributor';
import { BEP20 as BEP20Contract } from '../../generated/templates/VToken/BEP20';
import { VToken as VTokenContract } from '../../generated/templates/VToken/VToken';
import { BORROW, LIQUIDATE, MINT, REDEEM, REPAY, TRANSFER, zeroBigInt32 } from '../constants';
import { poolLensAddress, poolRegistryAddress } from '../constants/addresses';
import {
  exponentToBigInt,
  getTokenPriceInCents,
  valueOrNotAvailableIntIfReverted,
} from '../utilities';
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
  const poolDataFromLens = poolLensContract.getPoolByComptroller(poolRegistryAddress, comptroller);

  pool.name = poolDataFromLens.name;
  pool.creator = poolDataFromLens.creator;
  pool.blockPosted = poolDataFromLens.blockPosted;
  pool.timestampPosted = poolDataFromLens.timestampPosted;
  pool.category = poolDataFromLens.category;
  pool.logoUrl = poolDataFromLens.logoURL;
  pool.description = poolDataFromLens.description;
  pool.priceOracleAddress = poolDataFromLens.priceOracle;
  pool.closeFactorMantissa = poolDataFromLens.closeFactor
    ? poolDataFromLens.closeFactor
    : new BigInt(0);
  pool.minLiquidatableCollateralMantissa = poolDataFromLens.minLiquidatableCollateral;
  pool.liquidationIncentiveMantissa = poolDataFromLens.liquidationIncentive
    ? poolDataFromLens.liquidationIncentive
    : new BigInt(0);
  // Note: we don't index vTokens here because when a pool is created it has no markets
  pool.save();

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
  const underlyingAddress = vTokenContract.underlying();
  const underlyingContract = BEP20Contract.bind(Address.fromBytes(underlyingAddress));
  const market = new Market(vTokenAddress.toHexString());

  market.pool = comptroller.toHexString();

  market.name = vTokenContract.name();
  market.interestRateModelAddress = vTokenContract.interestRateModel();
  market.symbol = vTokenContract.symbol();

  const underlyingDecimals = underlyingContract.decimals();
  const underlyingValue = getTokenPriceInCents(comptroller, vTokenAddress, underlyingDecimals);
  market.underlyingAddress = underlyingAddress;
  market.underlyingName = underlyingContract.name();
  market.underlyingSymbol = underlyingContract.symbol();
  market.underlyingPriceCents = underlyingValue;
  market.underlyingDecimals = underlyingDecimals;
  market.vTokenDecimals = vTokenContract.decimals();

  market.borrowRateMantissa = vTokenContract.borrowRatePerBlock();

  market.cashMantissa = vTokenContract.getCash();
  const exchangeRateMantissa = valueOrNotAvailableIntIfReverted(
    vTokenContract.try_exchangeRateStored(),
  );

  market.exchangeRateMantissa = exchangeRateMantissa;

  market.reservesMantissa = vTokenContract.totalReserves();
  market.supplyRateMantissa = vTokenContract.supplyRatePerBlock();

  market.accrualBlockNumber = vTokenContract.accrualBlockNumber().toI32();

  market.blockTimestamp = blockTimestamp.toI32();

  market.borrowIndexMantissa = vTokenContract.borrowIndex();

  market.reserveFactorMantissa = vTokenContract.reserveFactorMantissa();

  market.totalBorrowsMantissa = vTokenContract.totalBorrows();

  const totalSupplyVTokensMantissa = vTokenContract.totalSupply();
  market.totalSupplyMantissa = totalSupplyVTokensMantissa
    .times(exchangeRateMantissa)
    .div(exponentToBigInt(18));

  market.badDebtMantissa = vTokenContract.badDebt();

  market.supplyCapMantissa = poolComptroller.supplyCaps(vTokenAddress);
  market.borrowCapMantissa = poolComptroller.borrowCaps(vTokenAddress);

  // suppliers and borrowers have to be counted through events
  market.supplierCount = zeroBigInt32;
  market.borrowerCount = zeroBigInt32;

  market.collateralFactorMantissa = poolComptroller
    .markets(vTokenAddress)
    .getCollateralFactorMantissa();
  market.liquidationThresholdMantissa = poolComptroller
    .markets(vTokenAddress)
    .getLiquidationThresholdMantissa();

  market.save();
  return market;
}

export const createMintTransaction = (event: Mint): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);

  const transaction = new Transaction(id);
  transaction.type = MINT;

  transaction.amountMantissa = event.params.mintAmount;
  transaction.to = event.params.minter;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
};

export const createRedeemTransaction = (event: Redeem): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);

  const transaction = new Transaction(id);
  transaction.type = REDEEM;

  transaction.amountMantissa = event.params.redeemAmount;
  transaction.to = event.params.redeemer;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
};

export const createBorrowTransaction = (event: Borrow): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);

  const transaction = new Transaction(id);
  transaction.type = BORROW;

  transaction.amountMantissa = event.params.borrowAmount;
  transaction.to = event.params.borrower;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();

  transaction.save();
};

export const createRepayBorrowTransaction = (event: RepayBorrow): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);

  const transaction = new Transaction(id);
  transaction.type = REPAY;

  transaction.amountMantissa = event.params.repayAmount;
  transaction.to = event.params.borrower;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
};

export const createLiquidateBorrowTransaction = (event: LiquidateBorrow): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);

  const transaction = new Transaction(id);
  transaction.type = LIQUIDATE;

  transaction.amountMantissa = event.params.repayAmount;
  transaction.to = event.params.borrower;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
};

export const createTransferTransaction = (event: Transfer): void => {
  const id = getTransactionEventId(event.transaction.hash, event.transactionLogIndex);

  const transaction = new Transaction(id);
  transaction.type = TRANSFER;
  transaction.amountMantissa = event.params.amount;
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
  accountVTokenBadDebt.amountMantissa = event.params.badDebtDelta;
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
