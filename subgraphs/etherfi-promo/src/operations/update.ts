import { Address, BigDecimal, ethereum } from '@graphprotocol/graph-ts';

import { BorrowerAccount, SupplierAccount, TVL } from '../../generated/schema';
import { ERC20 as ERC20Contract } from '../../generated/vWeETH/ERC20';
import { VToken as VTokenContract } from '../../generated/vWeETH/VToken';
import { getBorrowerAccount, getSupplierAccount, getTvl } from './get';
import exponentToBigDecimal from '../utilities/exponentToBigDecimal';

export function updateSupplierAccount(
  accountAddress: Address,
  tokenAddress: Address,
  amount: BigDecimal,
): SupplierAccount {
  const account = getSupplierAccount(accountAddress, tokenAddress)!;
  account.effective_balance = amount;
  account.save();
  return account;
}

export function updateBorrowerAccount(
  accountAddress: Address,
  tokenAddress: Address,
  amount: BigDecimal,
): BorrowerAccount {
  const account = getBorrowerAccount(accountAddress, tokenAddress)!;
  account.effective_balance = amount;
  account.save();
  return account;
}

export function updateTvl(event: ethereum.Event): TVL {
  const vTokenContract = VTokenContract.bind(event.address);
  const underlyingAddress = vTokenContract.underlying();
  const underlyingContract = ERC20Contract.bind(underlyingAddress);
  const tvl = getTvl(event.address);
  const totalBorrows = vTokenContract.totalBorrowsCurrent();
  const totalReserves = vTokenContract.totalReserves();
  const vTokenContractBalance = underlyingContract.balanceOf(event.address);
  tvl.tvl = vTokenContractBalance
    .plus(totalBorrows)
    .minus(totalReserves)
    .toBigDecimal()
    .div(exponentToBigDecimal(18));
  tvl.save();
  return tvl;
}
