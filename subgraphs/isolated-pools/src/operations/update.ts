import { Address, BigInt } from '@graphprotocol/graph-ts';

import { PoolMetadataUpdatedNewMetadataStruct } from '../../generated/PoolRegistry/PoolRegistry';
import { AccountVToken, Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { exponentToBigInt, valueOrNotAvailableIntIfReverted } from '../utilities';
import { getTokenPriceInCents } from '../utilities';
import { getOrCreateMarket } from './getOrCreate';
import { getOrCreateAccount, getOrCreateAccountVToken } from './getOrCreate';
import { getOrCreatePool } from './getOrCreate';

const updateAccountVToken = (
  accountAddress: Address,
  poolAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
): AccountVToken => {
  getOrCreateAccount(accountAddress);
  const accountVToken = getOrCreateAccountVToken(accountAddress, poolAddress, marketAddress, false);
  accountVToken.accrualBlockNumber = blockNumber;
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenSupply = (
  accountAddress: Address,
  poolAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
  accountSupplyBalanceMantissa: BigInt,
): AccountVToken => {
  const accountVToken = updateAccountVToken(
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
  const accountVToken = updateAccountVToken(
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
  const accountVToken = updateAccountVToken(
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

  const accountVToken = updateAccountVToken(
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
  const accountVToken = updateAccountVToken(
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
  const market = getOrCreateMarket(vTokenAddress);

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
