import { Address } from '@graphprotocol/graph-ts';

import { BorrowerAccount, SupplierAccount } from '../../generated/schema';
import { zeroBigDecimal } from '../constants';
import { getBorrow, getSupply } from '../operations/get';
import { getPositionId } from '../utilities/ids';

export const getOrCreateSupplierAccount = (accountAddress: Address, tokenAddress: Address): SupplierAccount => {
  let supplierAccount = SupplierAccount.load(getPositionId(accountAddress, tokenAddress));
  if (!supplierAccount) {
    const supply = getSupply(tokenAddress);
    supplierAccount = new SupplierAccount(getPositionId(accountAddress, tokenAddress));
    supplierAccount.address = accountAddress;
    supplierAccount.effective_balance = zeroBigDecimal;
    supplierAccount.token = supply.id;
    supplierAccount.save();
  }
  return supplierAccount;
};

export const getOrCreateBorrowerAccount = (accountAddress: Address, tokenAddress: Address): BorrowerAccount => {
  let borrowerAccount = BorrowerAccount.load(getPositionId(accountAddress, tokenAddress));
  if (!borrowerAccount) {
    const borrow = getBorrow(tokenAddress);
    borrowerAccount = new BorrowerAccount(getPositionId(accountAddress, tokenAddress));
    borrowerAccount.address = accountAddress;
    borrowerAccount.effective_balance = zeroBigDecimal;
    borrowerAccount.token = borrow.id;
    borrowerAccount.save();
  }
  return borrowerAccount;
};
