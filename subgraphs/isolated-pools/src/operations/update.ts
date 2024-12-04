import { Address, BigInt } from '@graphprotocol/graph-ts';

import { PoolMetadataUpdatedNewMetadataStruct } from '../../generated/PoolRegistry/PoolRegistry';
import { MarketPosition, Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { valueOrNotAvailableIntIfReverted } from '../utilities';
import { getTokenPriceInCents } from '../utilities';
import { getMarket } from './get';
import { getOrCreateAccount, getOrCreateMarketPosition, getOrCreatePool } from './getOrCreate';
import { oneBigInt, zeroBigInt32 } from '../constants';

export const updateMarketPositionAccrualBlockNumber = (
  accountAddress: Address,
  marketAddress: Address,
  poolAddress: Address,
  blockNumber: BigInt,
): MarketPosition => {
  getOrCreateAccount(accountAddress);
  const marketPosition = getOrCreateMarketPosition(
    accountAddress,
    marketAddress,
    poolAddress,
    false,
  );
  marketPosition.entity.accrualBlockNumber = blockNumber;
  marketPosition.entity.save();
  return marketPosition.entity as MarketPosition;
};

export const updateMarketPositionSupply = (
  accountAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
  accountSupplyBalanceMantissa: BigInt,
): MarketPosition => {
  const market = getMarket(marketAddress)!;
  const marketPosition = updateMarketPositionAccrualBlockNumber(
    accountAddress,
    marketAddress,
    Address.fromBytes(market.pool),
    blockNumber,
  );
  const _vTokenBalanceMantissa = marketPosition.vTokenBalanceMantissa;
  marketPosition.vTokenBalanceMantissa = accountSupplyBalanceMantissa;
  marketPosition.save();

  if (
    _vTokenBalanceMantissa.equals(zeroBigInt32) &&
    accountSupplyBalanceMantissa.notEqual(zeroBigInt32)
  ) {
    market.supplierCount = market.supplierCount.plus(oneBigInt);
  } else if (
    accountSupplyBalanceMantissa.equals(zeroBigInt32) &&
    _vTokenBalanceMantissa.notEqual(zeroBigInt32)
  ) {
    market.supplierCount = market.supplierCount.minus(oneBigInt);
  }
  market.save();
  return marketPosition as MarketPosition;
};

export const updateMarketPositionBorrow = (
  accountAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
  accountBorrows: BigInt,
): MarketPosition => {
  const market = getMarket(marketAddress)!;
  const marketPosition = updateMarketPositionAccrualBlockNumber(
    accountAddress,
    marketAddress,
    Address.fromBytes(market.pool),
    blockNumber,
  );
  const _storedBorrowBalanceMantissa = marketPosition.storedBorrowBalanceMantissa;
  marketPosition.storedBorrowBalanceMantissa = accountBorrows;
  const vTokenContract = VToken.bind(marketAddress);
  marketPosition.borrowIndex = vTokenContract.borrowIndex();
  marketPosition.save();

  if (_storedBorrowBalanceMantissa.equals(zeroBigInt32) && accountBorrows.notEqual(zeroBigInt32)) {
    market.borrowerCount = market.borrowerCount.plus(oneBigInt);
  } else if (
    accountBorrows.equals(zeroBigInt32) &&
    _storedBorrowBalanceMantissa.notEqual(zeroBigInt32)
  ) {
    market.borrowerCount = market.borrowerCount.minus(oneBigInt);
  }
  market.save();
  return marketPosition as MarketPosition;
};

export const updateMarket = (vTokenAddress: Address, blockNumber: BigInt): Market => {
  const market = getMarket(vTokenAddress)!;

  // Only updateMarket if it has not been updated this block
  if (market.accrualBlockNumber.equals(blockNumber)) {
    return market as Market;
  }
  const marketContract = VToken.bind(vTokenAddress);

  const tokenPriceCents = getTokenPriceInCents(
    Address.fromBytes(market.pool),
    vTokenAddress,
    market.underlyingDecimals,
  );
  market.lastUnderlyingPriceCents = tokenPriceCents;
  market.lastUnderlyingPriceBlockNumber = blockNumber;

  market.accrualBlockNumber = valueOrNotAvailableIntIfReverted(
    marketContract.try_accrualBlockNumber(),
  );

  const exchangeRateMantissa = valueOrNotAvailableIntIfReverted(
    marketContract.try_exchangeRateStored(),
  );
  market.exchangeRateMantissa = exchangeRateMantissa;

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
