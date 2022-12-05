import { Address, BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts';

import { PoolMetadataUpdatedNewMetadataStruct } from '../../generated/PoolRegistry/PoolRegistry';
import { AccountVToken, Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import {
  RiskRatings,
  defaultMantissaFactorBigDecimal,
  mantissaFactor,
  vTokenDecimals,
  vTokenDecimalsBigDecimal,
  zeroBigDecimal,
} from '../constants';
import { vBnbAddress } from '../constants/addresses';
import { exponentToBigDecimal } from '../utilities';
import { getBnbPriceInUsd, getTokenPriceInUsd } from '../utilities';
import { getMarket } from './get';
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
  const amountUnderlying = exchangeRate.times(amount.toBigDecimal().div(vTokenDecimalsBigDecimal));
  const amountUnderylingTruncated = amountUnderlying.truncate(underlyingDecimals);

  const accountVToken = updateAccountVToken(
    marketAddress,
    marketSymbol,
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
  );
  accountVToken.vTokenBalance = accountVToken.vTokenBalance.minus(
    amount.toBigDecimal().div(vTokenDecimalsBigDecimal).truncate(vTokenDecimals),
  );

  accountVToken.totalUnderlyingRedeemed =
    accountVToken.totalUnderlyingRedeemed.plus(amountUnderylingTruncated);
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
  exchangeRate: BigDecimal,
  underlyingDecimals: i32,
): AccountVToken => {
  const amountUnderlying = exchangeRate.times(amount.toBigDecimal().div(vTokenDecimalsBigDecimal));
  const amountUnderylingTruncated = amountUnderlying.truncate(underlyingDecimals);

  const accountVToken = updateAccountVToken(
    marketAddress,
    marketSymbol,
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
  );

  accountVToken.vTokenBalance = accountVToken.vTokenBalance.plus(
    amount.toBigDecimal().div(vTokenDecimalsBigDecimal).truncate(vTokenDecimals),
  );

  accountVToken.totalUnderlyingSupplied =
    accountVToken.totalUnderlyingSupplied.plus(amountUnderylingTruncated);

  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateMarket = (
  vTokenAddress: Address,
  blockNumber: i32,
  blockTimestamp: i32,
): Market => {
  const market = getMarket(vTokenAddress);

  // Only updateMarket if it has not been updated this block
  if (market.accrualBlockNumber === blockNumber) {
    return market as Market;
  }
  const marketContract = VToken.bind(vTokenAddress);

  const bnbPriceInUsd = getBnbPriceInUsd(marketContract.comptroller());

  // if vBNB, we only update USD price
  if (market.id == vBnbAddress.toHexString()) {
    market.underlyingPriceUsd = bnbPriceInUsd.truncate(market.underlyingDecimals);
  } else {
    const tokenPriceUsd = getTokenPriceInUsd(
      marketContract.comptroller(),
      vTokenAddress,
      market.underlyingDecimals,
    );
    if (bnbPriceInUsd.equals(BigDecimal.zero())) {
      market.underlyingPrice = BigDecimal.zero();
    } else {
      market.underlyingPrice = tokenPriceUsd.div(bnbPriceInUsd).truncate(market.underlyingDecimals);
    }
  }

  market.accrualBlockNumber = marketContract.accrualBlockNumber().toI32();
  market.blockTimestamp = blockTimestamp;
  market.totalSupply = marketContract.totalSupply().toBigDecimal().div(vTokenDecimalsBigDecimal);

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

  market.reserves = marketContract
    .totalReserves()
    .toBigDecimal()
    .div(exponentToBigDecimal(market.underlyingDecimals))
    .truncate(market.underlyingDecimals);

  market.totalBorrows = marketContract
    .totalBorrows()
    .toBigDecimal()
    .div(exponentToBigDecimal(market.underlyingDecimals))
    .truncate(market.underlyingDecimals);

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
