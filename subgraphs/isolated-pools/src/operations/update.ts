import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { PoolMetadataUpdatedNewMetadataStruct } from '../../generated/PoolRegistry/PoolRegistry';
import { AccountVToken, Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { zeroBigInt32 } from '../constants';
import { exponentToBigInt, valueOrNotAvailableIntIfReverted } from '../utilities';
import { getTokenPriceInCents } from '../utilities';
import { getOrCreateMarket } from './getOrCreate';
import {
  getOrCreateAccount,
  getOrCreateAccountVToken,
  getOrCreateAccountVTokenTransaction,
} from './getOrCreate';
import { getOrCreatePool } from './getOrCreate';

const updateAccountVToken = (
  marketAddress: Address,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
): AccountVToken => {
  getOrCreateAccount(accountAddress);
  const accountVToken = getOrCreateAccountVToken(accountAddress, marketAddress, false);
  getOrCreateAccountVTokenTransaction(
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
    marketAddress,
  );
  accountVToken.accrualBlockNumber = blockNumber;
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenSupply = (
  marketAddress: Address,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
  accountSupplyBalanceMantissa: BigInt,
): AccountVToken => {
  const accountVToken = updateAccountVToken(
    marketAddress,
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
  );
  accountVToken.accountSupplyBalanceMantissa = accountSupplyBalanceMantissa;
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenBorrow = (
  marketAddress: Address,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
  accountBorrows: BigInt,
  borrowIndexMantissa: BigInt,
): AccountVToken => {
  const accountVToken = updateAccountVToken(
    marketAddress,
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
  );
  accountVToken.accountBorrowBalanceMantissa = accountBorrows;
  accountVToken.accountBorrowIndexMantissa = borrowIndexMantissa;
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenRepayBorrow = (
  marketAddress: Address,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
  accountBorrows: BigInt,
  borrowIndexMantissa: BigInt,
): AccountVToken => {
  const accountVToken = updateAccountVToken(
    marketAddress,
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
  );
  accountVToken.accountBorrowBalanceMantissa = accountBorrows;
  accountVToken.accountBorrowIndexMantissa = borrowIndexMantissa;
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenTransferFrom = (
  marketAddress: Address,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
  amount: BigInt,
  exchangeRate: BigInt,
): AccountVToken => {
  const amountUnderlyingMantissa = exchangeRate.div(exponentToBigInt(18)).times(amount);

  const accountVToken = updateAccountVToken(
    marketAddress,
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
  );

  accountVToken.totalUnderlyingRedeemedMantissa =
    accountVToken.totalUnderlyingRedeemedMantissa.plus(amountUnderlyingMantissa);
  accountVToken.save();
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenTransferTo = (
  marketAddress: Address,
  accountAddress: Address,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
): AccountVToken => {
  const accountVToken = updateAccountVToken(
    marketAddress,
    accountAddress,
    txHash,
    timestamp,
    blockNumber,
    logIndex,
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
  market.totalSupplyMantissa = valueOrNotAvailableIntIfReverted(marketContract.try_totalSupply());
  if (market.totalSupplyMantissa.gt(zeroBigInt32) && exchangeRateMantissa.gt(zeroBigInt32)) {
    market.totalSupplyMantissa = market.totalSupplyMantissa
      .times(exchangeRateMantissa)
      .div(exponentToBigInt(18));
  }

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
