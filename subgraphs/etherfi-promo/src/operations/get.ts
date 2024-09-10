import { Address } from '@graphprotocol/graph-ts';

import { Borrow, BorrowerAccount, SupplierAccount, Supply, TVL } from '../../generated/schema';
import { zeroBigInt32 } from '../constants';
import { getPositionId } from '../utilities/ids';

export const getTvl = (vTokenAddress: Address): TVL => {
  let tvl = TVL.load(vTokenAddress);
  if (!tvl) {
    tvl = new TVL(vTokenAddress);
    tvl.tvl = zeroBigInt32;
    tvl.save();
  }
  tvl.save();
  return tvl;
};

export const getSupply = (tokenAddress: Address): Supply => {
  let supply = Supply.load(tokenAddress);
  if (!supply) {
    supply = new Supply(tokenAddress);
  }
  supply.save();
  return supply;
};

export const getSupplierAccount = (
  accountAddress: Address,
  tokenAddress: Address,
): SupplierAccount | null => {
  const supplierAccount = SupplierAccount.load(getPositionId(accountAddress, tokenAddress));
  return supplierAccount;
};

export const getBorrow = (tokenAddress: Address): Borrow => {
  let borrow = Borrow.load(tokenAddress);
  if (!borrow) {
    borrow = new Borrow(tokenAddress);
  }
  borrow.save();
  return borrow;
};

export const getBorrowerAccount = (
  accountAddress: Address,
  tokenAddress: Address,
): BorrowerAccount | null => {
  const borrowerAccount = BorrowerAccount.load(getPositionId(accountAddress, tokenAddress));
  return borrowerAccount;
};
