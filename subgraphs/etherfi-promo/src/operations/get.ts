import { Address } from '@graphprotocol/graph-ts';
import { VToken } from '../../generated/vWeETH/VToken';
import { Borrow, BorrowerAccount, SupplierAccount, Supply, TVL } from '../../generated/schema';
import { zeroBigDecimal } from '../constants';
import { getPositionId } from '../utilities/ids';

export const getTvl = (vTokenAddress: Address): TVL => {
  let tvl = TVL.load(vTokenAddress);
  if (!tvl) {
    tvl = new TVL(vTokenAddress);
    tvl.tvl = zeroBigDecimal;
    tvl.save();
  }
  tvl.save();
  return tvl;
};

export const getSupply = (tokenAddress: Address): Supply => {
  let supply = Supply.load(tokenAddress);
  if (!supply) {
    supply = new Supply(tokenAddress);

    const vTokenContract = VToken.bind(tokenAddress);
    const underlyingAddress = vTokenContract.underlying();
    const erc20 = VToken.bind(underlyingAddress);

    supply.underlyingAddress = underlyingAddress;
    supply.underlyingDecimals = erc20.decimals();
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
    const vTokenContract = VToken.bind(tokenAddress);
    const underlyingAddress = vTokenContract.underlying();
    const erc20 = VToken.bind(underlyingAddress);

    borrow.underlyingAddress = underlyingAddress;
    borrow.underlyingDecimals = erc20.decimals();
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
