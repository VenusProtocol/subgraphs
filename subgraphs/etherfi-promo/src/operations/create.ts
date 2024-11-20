import { Address, BigInt } from '@graphprotocol/graph-ts';

import { BorrowerAccount, SupplierAccount } from '../../generated/schema';
import { getPositionId } from '../utilities/ids';

export function createSupplierAccount(accountAddress: Address, tokenAddress: Address, amount: BigInt): SupplierAccount {
  const account = new SupplierAccount(getPositionId(accountAddress, tokenAddress));
  account.address = accountAddress;
  account.effective_balance = amount;
  account.token = tokenAddress;
  account.save();
  return account;
}

export function createBorrowerAccount(accountAddress: Address, tokenAddress: Address, amount: BigInt): BorrowerAccount {
  const account = new BorrowerAccount(getPositionId(accountAddress, tokenAddress));
  account.address = accountAddress;
  account.effective_balance = amount;
  account.token = tokenAddress;
  account.save();
  return account;
}
