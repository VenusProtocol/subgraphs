import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { VToken as VTokenContract } from '../../generated/vWeETH/VToken';
import exponentToBigDecimal from './exponentToBigDecimal';
import { getSupply } from '../operations/get';

// we have to take into consideration the exchange rate in this case
// so we will ask the VToken contract the exchangeRateCurrent
// and then calculate the underlying amount
export const calculateUnderlyingAmountFromVTokenAmount = (
  vTokenAmount: BigInt,
  vTokenAddress: Address,
): BigDecimal => {
  const vTokenContract = VTokenContract.bind(vTokenAddress);
  const exchangeRateMantissa = vTokenContract.exchangeRateCurrent();
  const vToken = getSupply(Address.fromBytes(vTokenAddress));

  const amountUnderlying = exchangeRateMantissa
    .times(vTokenAmount)
    .toBigDecimal()
    .div(exponentToBigDecimal(18 + vToken.underlyingDecimals))
    .truncate(vToken.underlyingDecimals);

  return amountUnderlying;
};
