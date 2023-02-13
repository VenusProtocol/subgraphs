import { Address, BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts';

import { PoolMetadataUpdatedNewMetadataStruct } from '../../generated/PoolRegistry/PoolRegistry';
import { AccountVToken, Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import {
  RiskRatings,
  defaultMantissaFactorBigDecimal,
  mantissaFactor,
  vTokenDecimalsBigDecimal,
  zeroBigDecimal,
} from '../constants';
import { exponentToBigDecimal } from '../utilities';
import { getTokenPriceInUsd } from '../utilities';
import { getOrCreateMarket } from './getOrCreate';
import {
  getOrCreateAccount,
  getOrCreateAccountVToken,
  getOrCreateAccountVTokenTransaction,
} from './getOrCreate';
import { getOrCreatePool } from './getOrCreate';

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
  accountBorrows: BigInt,
  borrowIndex: BigDecimal,
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
  accountVToken.accountBorrowBalanceWei = accountBorrows;
  accountVToken.accountBorrowIndex = borrowIndex;
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
  accountBorrows: BigInt,
  borrowIndex: BigDecimal,
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
  accountVToken.accountBorrowBalanceWei = accountBorrows;
  accountVToken.accountBorrowIndex = borrowIndex;
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenTransferFrom = (
  marketAddress: Address,
  marketSymbol: string,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
  amount: BigInt,
  exchangeRate: BigDecimal,
  underlyingDecimals: i32,
): AccountVToken => {
  const amountUnderlying = exchangeRate
    .times(exponentToBigDecimal(underlyingDecimals))
    .times(amount.toBigDecimal());

  const accountVToken = updateAccountVToken(
    marketAddress,
    marketSymbol,
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
  );
  accountVToken.accountSupplyBalanceWei = accountVToken.accountSupplyBalanceWei.minus(amount);

  accountVToken.totalUnderlyingRedeemedWei =
    accountVToken.totalUnderlyingRedeemedWei.plus(amountUnderlying);
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenTransferTo = (
  marketAddress: Address,
  marketSymbol: string,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
  amount: BigInt,
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

  accountVToken.accountSupplyBalanceWei = accountVToken.accountSupplyBalanceWei.plus(amount);

  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateMarket = (
  vTokenAddress: Address,
  blockNumber: i32,
  blockTimestamp: i32,
): Market => {
  const market = getOrCreateMarket(vTokenAddress);

  // Only updateMarket if it has not been updated this block
  if (market.accrualBlockNumber === blockNumber) {
    return market as Market;
  }
  const marketContract = VToken.bind(vTokenAddress);

  const tokenPriceUsd = getTokenPriceInUsd(
    marketContract.comptroller(),
    vTokenAddress,
    market.underlyingDecimals,
  );
  market.underlyingPriceUsd = tokenPriceUsd.truncate(market.underlyingDecimals);

  market.accrualBlockNumber = marketContract.accrualBlockNumber().toI32();
  market.blockTimestamp = blockTimestamp;

  /* Exchange rate explanation
     In Practice
      - If you call the vDAI contract on bscscan it comes back (2.0 * 10^26)
      - If you call the vUSDC contract on bscscan it comes back (2.0 * 10^14)
      - The real value is ~0.02. So vDAI is off by 10^28, and vUSDC 10^16
     How to calculate for tokens with different decimals
      - Must div by tokenDecimals, 10^market.underlyingDecimals
      - Must multiply by vtokenDecimals, 10^8
      - Must div by mantissa, 10^18
   */
  market.exchangeRate = marketContract
    .exchangeRateStored()
    .toBigDecimal()
    .div(exponentToBigDecimal(market.underlyingDecimals))
    .times(vTokenDecimalsBigDecimal)
    .div(defaultMantissaFactorBigDecimal)
    .truncate(mantissaFactor);

  market.borrowIndex = marketContract
    .borrowIndex()
    .toBigDecimal()
    .div(defaultMantissaFactorBigDecimal)
    .truncate(mantissaFactor);

  market.reservesWei = marketContract.totalReserves();

  market.cash = marketContract
    .getCash()
    .toBigDecimal()
    .div(exponentToBigDecimal(market.underlyingDecimals))
    .truncate(market.underlyingDecimals);

  // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Venus Solidity
  market.borrowRate = marketContract
    .borrowRatePerBlock()
    .toBigDecimal()
    .div(defaultMantissaFactorBigDecimal)
    .truncate(mantissaFactor);

  // This fails on only the first call to cZRX. It is unclear why, but otherwise it works.
  // So we handle it like this.
  const supplyRatePerBlock = marketContract.try_supplyRatePerBlock();
  if (supplyRatePerBlock.reverted) {
    log.info('***CALL FAILED*** : vBEP20 supplyRatePerBlock() reverted', []);
    market.supplyRate = zeroBigDecimal;
  } else {
    market.supplyRate = supplyRatePerBlock.value
      .toBigDecimal()
      .div(defaultMantissaFactorBigDecimal)
      .truncate(mantissaFactor);
  }

  market.treasuryTotalBorrowsWei = marketContract.totalBorrows();
  market.treasuryTotalSupplyWei = marketContract.totalSupply();

  market.save();
  return market as Market;
};

export function updatePoolMetadata(
  comptroller: Address,
  newMetadata: PoolMetadataUpdatedNewMetadataStruct,
): void {
  const pool = getOrCreatePool(comptroller);
  if (pool) {
    pool.riskRating = RiskRatings[newMetadata.riskRating];
    pool.category = newMetadata.category;
    pool.logoUrl = newMetadata.logoURL;
    pool.description = newMetadata.description;
    pool.save();
  }
}
