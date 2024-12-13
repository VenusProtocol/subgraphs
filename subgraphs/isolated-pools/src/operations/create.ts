import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Comptroller as ComptrollerContract } from '../../generated/PoolRegistry/Comptroller';
import { PoolRegistry as PoolRegistryContract } from '../../generated/PoolRegistry/PoolRegistry';
import { VToken as VTokenDataSource } from '../../generated/templates';
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
  AccountPool,
  MarketPositionBadDebt,
  Market,
  Pool,
  RewardsDistributor,
  Transaction,
} from '../../generated/schema';
import { Comptroller } from '../../generated/templates/Pool/Comptroller';
import { RewardsDistributor as RewardDistributorContract } from '../../generated/templates/RewardsDistributor/RewardsDistributor';
import { VToken as VTokenContract } from '../../generated/templates/VToken/VToken';
import { BORROW, LIQUIDATE, MINT, REDEEM, REPAY, TRANSFER, zeroBigInt32 } from '../constants';
import {
  poolRegistryAddress,
  vBifiAddress,
  vLisUsdAddress,
  vSnBNBAddress,
  vagEURAddress,
  vankrBNBDeFiAddress,
  vankrBNBLiquidStakedBNBAddress,
  vWETHLiquidStakedETHAddress,
  vWETHCoreAddress,
} from '../constants/addresses';
import { getOrCreateMarketReward, getOrCreateToken } from './getOrCreate';
import { getTokenPriceInCents, valueOrNotAvailableIntIfReverted } from '../utilities';
import {
  getAccountId,
  getAccountPoolId,
  getMarketPositionId,
  getBadDebtEventId,
  getPoolId,
  getRewardsDistributorId,
  getTransactionEventId,
} from '../utilities/ids';
import valueOrFalseIfReverted from '../utilities/valueOrFalseIfReverted';

export function createPool(comptroller: Address): Pool {
  const pool = new Pool(getPoolId(comptroller));
  // Fill in pool from pool lens
  const poolRegistryContract = PoolRegistryContract.bind(poolRegistryAddress);
  const comptrollerContract = ComptrollerContract.bind(comptroller);
  const poolData = poolRegistryContract.getPoolByComptroller(comptroller);
  const poolMetaData = poolRegistryContract.getVenusPoolMetadata(comptroller);

  pool.address = comptroller;
  pool.name = poolData.name;
  pool.creator = poolData.creator;
  pool.blockPosted = poolData.blockPosted;
  pool.timestampPosted = poolData.timestampPosted;
  pool.category = poolMetaData.category;
  pool.logoUrl = poolMetaData.logoURL;
  pool.description = poolMetaData.description;
  pool.priceOracleAddress = comptrollerContract.oracle();
  pool.closeFactorMantissa = comptrollerContract.closeFactorMantissa();
  pool.minLiquidatableCollateralMantissa = comptrollerContract.minLiquidatableCollateral();
  pool.liquidationIncentiveMantissa = comptrollerContract.liquidationIncentiveMantissa();
  // Note: we don't index vTokens here because when a pool is created it has no markets
  pool.save();

  return pool;
}

export function createAccount(accountAddress: Address): Account {
  const account = new Account(accountAddress);
  account.address = accountAddress;
  account.countLiquidated = 0;
  account.countLiquidator = 0;
  account.hasBorrowed = false;
  account.save();
  return account;
}

export function createAccountPool(accountAddress: Address, poolAddress: Address): AccountPool {
  const accountPoolId = getAccountPoolId(accountAddress, poolAddress);
  const accountPool = new AccountPool(accountPoolId);
  accountPool.account = getAccountId(accountAddress);
  accountPool.pool = getPoolId(poolAddress);
  accountPool.save();
  return accountPool;
}

export function createMarket(
  vTokenAddress: Address,
  comptroller: Address,
  blockNumber: BigInt,
): Market | null {
  if (vTokenAddress.equals(vBifiAddress)) {
    return null;
  }
  VTokenDataSource.create(vTokenAddress);
  const vTokenContract = VTokenContract.bind(vTokenAddress);
  const poolComptroller = Comptroller.bind(comptroller);
  const underlyingAddress = vTokenContract.underlying();

  const market = new Market(vTokenAddress);

  market.address = vTokenAddress;
  market.pool = comptroller;

  market.name = vTokenContract.name();
  market.isListed = true;
  market.interestRateModelAddress = vTokenContract.interestRateModel();
  market.symbol = vTokenContract.symbol();
  market.vTokenDecimals = vTokenContract.decimals();
  const underlyingToken = getOrCreateToken(underlyingAddress);
  market.underlyingToken = underlyingToken.id;

  const underlyingValue = getTokenPriceInCents(
    comptroller,
    vTokenAddress,
    underlyingToken.decimals,
  );
  market.lastUnderlyingPriceCents = underlyingValue;
  market.lastUnderlyingPriceBlockNumber = blockNumber;
  market.accessControlManagerAddress = vTokenContract.accessControlManager();
  market.borrowRateMantissa = vTokenContract.borrowRatePerBlock();

  market.cashMantissa = vTokenContract.getCash();
  const exchangeRateMantissa = valueOrNotAvailableIntIfReverted(
    vTokenContract.try_exchangeRateStored(),
  );

  market.exchangeRateMantissa = exchangeRateMantissa;

  market.reservesMantissa = vTokenContract.totalReserves();
  market.supplyRateMantissa = vTokenContract.supplyRatePerBlock();

  market.accrualBlockNumber = vTokenContract.accrualBlockNumber();

  market.borrowIndex = vTokenContract.borrowIndex();

  market.reserveFactorMantissa = vTokenContract.reserveFactorMantissa();

  market.totalBorrowsMantissa = zeroBigInt32;

  market.totalSupplyVTokenMantissa = zeroBigInt32;

  market.badDebtMantissa = zeroBigInt32;

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

  if (vTokenAddress.equals(vLisUsdAddress)) {
    market.name = 'Venus lisUSD (Stablecoins)';
    market.symbol = 'vlisUSD_Stablecoins';
  }

  if (vTokenAddress.equals(vagEURAddress)) {
    market.name = 'Venus EURA (Stablecoins)';
    market.symbol = 'vEURA_Stablecoins';
  }

  if (vTokenAddress.equals(vankrBNBLiquidStakedBNBAddress)) {
    market.underlyingToken = getOrCreateToken(
      Address.fromBytes(Bytes.fromHexString('0x5269b7558D3d5E113010Ef1cFF0901c367849CC9')),
    ).id;
    market.symbol = 'vankrBNB_LiquidStakedBNB';
  }

  if (vTokenAddress.equals(vankrBNBDeFiAddress)) {
    market.underlyingToken = getOrCreateToken(
      Address.fromBytes(Bytes.fromHexString('0x5269b7558D3d5E113010Ef1cFF0901c367849CC9')),
    ).id;
    market.symbol = 'vankrBNB_DeFi';
  }

  if (vTokenAddress.equals(vSnBNBAddress)) {
    market.name = 'Venus slisBNB (Liquid Staked BNB)';
    market.symbol = 'vslisBNB_LiquidStakedBNB';
  }

  if (vTokenAddress.equals(vWETHLiquidStakedETHAddress) || vTokenAddress.equals(vWETHCoreAddress)) {
    market.underlyingToken = getOrCreateToken(
      Address.fromBytes(Bytes.fromHexString('0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9')),
    ).id;
  }

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

export const createMarketPositionBadDebt = (
  marketAddress: Address,
  event: BadDebtIncreased,
): void => {
  const id = getBadDebtEventId(event.transaction.hash, event.transactionLogIndex);

  const marketPositionBadDebt = new MarketPositionBadDebt(id);
  const marketPositionId = getMarketPositionId(event.params.borrower, marketAddress);
  marketPositionBadDebt.account = marketPositionId;
  marketPositionBadDebt.block = event.block.number;
  marketPositionBadDebt.amountMantissa = event.params.badDebtDelta;
  marketPositionBadDebt.timestamp = event.block.timestamp;
  marketPositionBadDebt.save();
};

export function createRewardDistributor(
  rewardsDistributorAddress: Address,
  comptrollerAddress: Address,
): RewardsDistributor {
  const rewardDistributorContract = RewardDistributorContract.bind(rewardsDistributorAddress);
  const rewardToken = rewardDistributorContract.rewardToken();
  const id = getRewardsDistributorId(rewardsDistributorAddress);
  const rewardsDistributor = new RewardsDistributor(id);
  rewardsDistributor.address = rewardsDistributorAddress;
  rewardsDistributor.pool = comptrollerAddress;
  rewardsDistributor.rewardToken = getOrCreateToken(rewardToken).id;
  rewardsDistributor.isTimeBased = valueOrFalseIfReverted(
    rewardDistributorContract.try_isTimeBased(),
  );
  rewardsDistributor.save();

  // we get the current speeds for all known markets at this point in time
  const comptroller = Comptroller.bind(comptrollerAddress);
  const marketAddresses = comptroller.getAllMarkets();

  if (marketAddresses !== null) {
    for (let i = 0; i < marketAddresses.length; i++) {
      const marketAddress = marketAddresses[i];

      const rewardSpeed = getOrCreateMarketReward(rewardsDistributorAddress, marketAddress);
      rewardSpeed.borrowSpeedPerBlockMantissa =
        rewardDistributorContract.rewardTokenBorrowSpeeds(marketAddress);
      rewardSpeed.supplySpeedPerBlockMantissa =
        rewardDistributorContract.rewardTokenSupplySpeeds(marketAddress);
      rewardSpeed.save();
    }
  }
  return rewardsDistributor;
}
