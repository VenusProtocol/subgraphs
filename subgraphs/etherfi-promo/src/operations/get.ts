import { Address } from '@graphprotocol/graph-ts';

import { Borrow, BorrowerAccount, SupplierAccount, Supply, TVL } from '../../generated/schema';
import { BORROW, SUPPLY, TOTAL_VALUE_LOCKED, zeroBigInt32 } from '../constants';

export const getTvl = (): TVL => {
  let tvl = TVL.load(TOTAL_VALUE_LOCKED);
  if (!tvl) {
    tvl = new TVL(TOTAL_VALUE_LOCKED);
    tvl.tvl = zeroBigInt32;
    tvl.save();
  }
  tvl.save();
  return tvl;
};

export const getSupply = (): Supply => {
  let supply = Supply.load(SUPPLY);
  if (!supply) {
    supply = new Supply(SUPPLY);
  }
  supply.save();
  return supply;
};

export const getSupplierAccount = (accountAddress: Address): SupplierAccount | null => {
  const supplierAccount = SupplierAccount.load(accountAddress.toHexString());
  return supplierAccount;
};

export const getBorrow = (): Borrow => {
  let borrow = Borrow.load(BORROW);
  if (!borrow) {
    borrow = new Borrow(BORROW);
  }
  borrow.save();
  return borrow;
};

export const getBorrowerAccount = (accountAddress: Address): BorrowerAccount | null => {
  const borrowerAccount = BorrowerAccount.load(accountAddress.toHexString());
  return borrowerAccount;
};
