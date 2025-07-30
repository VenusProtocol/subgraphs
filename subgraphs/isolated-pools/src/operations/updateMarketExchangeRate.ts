import { BigInt } from '@graphprotocol/graph-ts';
import { Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { valueOrNotAvailableIntIfReverted } from '../utilities';

export function updateMarketExchangeRate(market: Market, vTokenContract: VToken): BigInt {
  market.exchangeRateMantissa = valueOrNotAvailableIntIfReverted(
    vTokenContract.try_exchangeRateStored(),
  );
  return market.exchangeRateMantissa;
}
