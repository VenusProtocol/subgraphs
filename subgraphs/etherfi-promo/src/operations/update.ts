import { Address, BigInt } from '@graphprotocol/graph-ts';

import { BorrowerAccount, SupplierAccount, TVL } from '../../generated/schema';
import { ERC20 as ERC20Contract } from '../../generated/vWeETH/ERC20';
import { VToken as VTokenContract } from '../../generated/vWeETH/VToken';
import { vWeEthAddress, weEthAddress } from '../constants/addresses';
import { getBorrowerAccount, getSupplierAccount, getTvl } from './get';

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

export function updateTvl(): TVL {
  const vTokenContract = VTokenContract.bind(vWeEthAddress);
  const weEthContract = ERC20Contract.bind(weEthAddress);
  const tvl = getTvl();
  const totalBorrows = vTokenContract.totalBorrows();
  const totalReserves = vTokenContract.totalReserves();
  const vTokenContractBalance = weEthContract.balanceOf(vWeEthAddress);
  tvl.tvl = vTokenContractBalance.plus(totalBorrows).minus(totalReserves);
  tvl.save();
  return tvl;
}
