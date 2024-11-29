import { Address, BigInt } from '@graphprotocol/graph-ts';

import { AccountVToken } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { valueOrNotAvailableIntIfReverted } from '../utilities';

import { getMarket } from './get';
import { getOrCreateAccount, getOrCreateAccountVToken } from './getOrCreate';
import { oneBigInt, zeroBigInt32 } from '../constants';

export const updateAccountVTokenAccrualBlockNumber = (
  accountAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
): AccountVToken => {
  getOrCreateAccount(accountAddress);
  const accountVToken = getOrCreateAccountVToken(accountAddress, marketAddress);
  accountVToken.entity.accrualBlockNumber = blockNumber;
  accountVToken.entity.save();
  return accountVToken.entity as AccountVToken;
};

export const updateAccountVTokenSupply = (
  accountAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
  accountSupplyBalanceMantissa: BigInt,
): AccountVToken => {
  const market = getMarket(marketAddress)!;
  const accountVToken = updateAccountVTokenAccrualBlockNumber(
    accountAddress,
    marketAddress,
    blockNumber,
  );
  const _vTokenBalanceMantissa = accountVToken.vTokenBalanceMantissa;
  accountVToken.vTokenBalanceMantissa = accountSupplyBalanceMantissa;
  accountVToken.save();

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
  return accountVToken as AccountVToken;
};

export const updateAccountVTokenBorrow = (
  accountAddress: Address,
  marketAddress: Address,
  blockNumber: BigInt,
  accountBorrows: BigInt,
): AccountVToken => {
  const market = getMarket(marketAddress)!;
  const accountVToken = updateAccountVTokenAccrualBlockNumber(
    accountAddress,
    marketAddress,
    blockNumber,
  );
  const _storedBorrowBalanceMantissa = accountVToken.storedBorrowBalanceMantissa;
  accountVToken.storedBorrowBalanceMantissa = accountBorrows;
  const vTokenContract = VToken.bind(marketAddress);
  accountVToken.borrowIndex = vTokenContract.borrowIndex();
  accountVToken.save();

  if (_storedBorrowBalanceMantissa.equals(zeroBigInt32) && accountBorrows.notEqual(zeroBigInt32)) {
    market.borrowerCount = market.borrowerCount.plus(oneBigInt);
  } else if (
    accountBorrows.equals(zeroBigInt32) &&
    _storedBorrowBalanceMantissa.notEqual(zeroBigInt32)
  ) {
    market.borrowerCount = market.borrowerCount.minus(oneBigInt);
  }
  market.save();
  return accountVToken as AccountVToken;
};
