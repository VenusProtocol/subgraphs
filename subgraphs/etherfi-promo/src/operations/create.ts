import { Address, BigInt } from '@graphprotocol/graph-ts';

import { BorrowerAccount, SupplierAccount } from '../../generated/schema';
import { getBorrow, getSupply } from './get';

export function createSupplierAccount(accountAddress: Address, amount: BigInt): SupplierAccount {
  const account = new SupplierAccount(accountAddress.toHexString());
  account.address = accountAddress;
  account.effective_balance = amount;
  account.type = getSupply().id;
  account.save();
  return account;
}

export function createBorrowerAccount(accountAddress: Address, amount: BigInt): BorrowerAccount {
  const account = new BorrowerAccount(accountAddress.toHexString());
  account.address = accountAddress;
  account.effective_balance = amount;
  account.type = getBorrow().id;
  account.save();
  return account;
}
