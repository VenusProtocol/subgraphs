import { Address, BigInt } from '@graphprotocol/graph-ts';

import { PoolMetadataUpdatedNewMetadataStruct } from '../../generated/PoolRegistry/PoolRegistry';
import { AccountVToken, Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { exponentToBigInt, valueOrNotAvailableIntIfReverted } from '../utilities';
import { getTokenPriceInCents } from '../utilities';
import { getMarket } from './get';
import { getOrCreateAccount, getOrCreateAccountVToken, getOrCreatePool } from './getOrCreate';

export const updateAccountVTokenAccrualBlockNumber = (
  accountAddress: Address,
  poolAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
): AccountVToken => {
  getOrCreateAccount(accountAddress);
  const accountVToken = getOrCreateAccountVToken(accountAddress, poolAddress, marketAddress, false);
  accountVToken.entity.accrualBlockNumber = blockNumber;
  accountVToken.entity.save();
  return accountVToken.entity as AccountVToken;
};

export const updateAccountVTokenSupply = (
  accountAddress: Address,
  poolAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
  accountSupplyBalanceMantissa: BigInt,
): AccountVToken => {
  const accountVToken = updateAccountVTokenAccrualBlockNumber(
    accountAddress,
    poolAddress,
    marketAddress,
    blockNumber,
  );
  accountVToken.accountVTokenSupplyBalanceMantissa = accountSupplyBalanceMantissa;
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenBorrow = (
  accountAddress: Address,
  poolAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
  accountBorrows: BigInt,
  borrowIndexMantissa: BigInt,
): AccountVToken => {
  const accountVToken = updateAccountVTokenAccrualBlockNumber(
    accountAddress,
    poolAddress,
    marketAddress,
    blockNumber,
  );
  accountVToken.accountBorrowBalanceMantissa = accountBorrows;
  accountVToken.accountBorrowIndexMantissa = borrowIndexMantissa;
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenRepayBorrow = (
  accountAddress: Address,
  poolAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
  accountBorrows: BigInt,
  borrowIndexMantissa: BigInt,
): AccountVToken => {
  const accountVToken = updateAccountVTokenAccrualBlockNumber(
    accountAddress,
    poolAddress,
    marketAddress,
    blockNumber,
  );
  accountVToken.accountBorrowBalanceMantissa = accountBorrows;
  accountVToken.accountBorrowIndexMantissa = borrowIndexMantissa;
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenTransferFrom = (
  accountAddress: Address,
  poolAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
  amount: BigInt,
  exchangeRate: BigInt,
): AccountVToken => {
  const amountUnderlyingMantissa = exchangeRate.div(exponentToBigInt(18)).times(amount);

  const accountVToken = updateAccountVTokenAccrualBlockNumber(
    accountAddress,
    poolAddress,
    marketAddress,
    blockNumber,
  );

  accountVToken.totalUnderlyingRedeemedMantissa =
    accountVToken.totalUnderlyingRedeemedMantissa.plus(amountUnderlyingMantissa);
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenTransferTo = (
  accountAddress: Address,
  poolAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
): AccountVToken => {
  const accountVToken = updateAccountVTokenAccrualBlockNumber(
    accountAddress,
    poolAddress,
    marketAddress,
    blockNumber,
  );

  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateMarket = (
  vTokenAddress: Address,
  blockNumber: i32,
  blockTimestamp: i32,
): Market => {
  const market = getMarket(vTokenAddress)!;

  // Only updateMarket if it has not been updated this block
  if (market.accrualBlockNumber === blockNumber) {
    return market as Market;
  }
  const marketContract = VToken.bind(vTokenAddress);

  const tokenPriceCents = getTokenPriceInCents(
    marketContract.comptroller(),
    vTokenAddress,
    market.underlyingDecimals,
  );
  market.underlyingPriceCentsMantissa = tokenPriceCents;

  market.accrualBlockNumber = valueOrNotAvailableIntIfReverted(
    marketContract.try_accrualBlockNumber(),
  ).toI32();
  market.blockTimestamp = blockTimestamp;

  const exchangeRateMantissa = valueOrNotAvailableIntIfReverted(
    marketContract.try_exchangeRateStored(),
  );
  market.exchangeRateMantissa = exchangeRateMantissa;

  market.borrowIndexMantissa = valueOrNotAvailableIntIfReverted(marketContract.try_borrowIndex());

  market.reservesMantissa = valueOrNotAvailableIntIfReverted(marketContract.try_totalReserves());

  const cashBigInt = valueOrNotAvailableIntIfReverted(marketContract.try_getCash());
  market.cashMantissa = cashBigInt;

  // calling supplyRatePerBlock & borrowRatePerBlock can fail due to external reasons, so we fall back to 0 in case of an error
  market.borrowRateMantissa = valueOrNotAvailableIntIfReverted(
    marketContract.try_borrowRatePerBlock(),
  );
  market.supplyRateMantissa = valueOrNotAvailableIntIfReverted(
    marketContract.try_supplyRatePerBlock(),
  );

  market.totalBorrowsMantissa = valueOrNotAvailableIntIfReverted(marketContract.try_totalBorrows());
  market.totalSupplyVTokenMantissa = valueOrNotAvailableIntIfReverted(
    marketContract.try_totalSupply(),
  );

  market.save();
  return market as Market;
};

export function updatePoolMetadata(
  comptroller: Address,
  newMetadata: PoolMetadataUpdatedNewMetadataStruct,
): void {
  const pool = getOrCreatePool(comptroller);
  if (pool) {
    pool.category = newMetadata.category;
    pool.logoUrl = newMetadata.logoURL;
    pool.description = newMetadata.description;
    pool.save();
  }
}
