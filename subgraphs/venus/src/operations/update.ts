import { Address, BigInt } from '@graphprotocol/graph-ts';

import { MarketPosition } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { valueOrNotAvailableIntIfReverted } from '../utilities';
import { getMarket } from './get';
import { getOrCreateAccount, getOrCreateMarketPosition } from './getOrCreate';
import { oneBigInt, zeroBigInt32 } from '../constants';

export const updateMarketPositionAccrualBlockNumber = (
  accountAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
): MarketPosition => {
  getOrCreateAccount(accountAddress);
  const marketPosition = getOrCreateMarketPosition(accountAddress, marketAddress);
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
    blockNumber,
  );
  const _storedBorrowBalanceMantissa = marketPosition.storedBorrowBalanceMantissa;
  marketPosition.storedBorrowBalanceMantissa = accountBorrows;
  const vTokenContract = VToken.bind(marketAddress);
  marketPosition.borrowIndex = valueOrNotAvailableIntIfReverted(
    vTokenContract.try_borrowIndex(),
    'vBEP20 try_borrowIndex()',
  );
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
