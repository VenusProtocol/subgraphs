import { Address, BigInt } from '@graphprotocol/graph-ts';

import { BorrowerAccount, SupplierAccount } from '../../generated/schema';
import { getBorrowerAccount, getSupplierAccount } from './get';

export function updateSupplierAccount(accountAddress: Address, amount: BigInt): SupplierAccount {
  const account = getSupplierAccount(accountAddress)!;
  account.effective_balance = amount;
  account.save();
  return account;
}

export function updateBorrowerAccount(accountAddress: Address, amount: BigInt): BorrowerAccount {
  const account = getBorrowerAccount(accountAddress)!;
  account.effective_balance = amount;
  account.save();
  return account;
}
