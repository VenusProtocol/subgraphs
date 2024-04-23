import { Address } from '@graphprotocol/graph-ts';

import { Borrow, BorrowerAccount, SupplierAccount, Supply } from '../../generated/schema';
import { BORROW, SUPPLY } from '../constants';

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
