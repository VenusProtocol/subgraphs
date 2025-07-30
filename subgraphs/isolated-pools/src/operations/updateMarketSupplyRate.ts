import { BigInt } from '@graphprotocol/graph-ts';
import { Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { valueOrNotAvailableIntIfReverted } from '../utilities';

export function updateMarketSupplyRate(market: Market, vTokenContract: VToken): BigInt {
  market.supplyRateMantissa = valueOrNotAvailableIntIfReverted(
    vTokenContract.try_supplyRatePerBlock(),
  );

  return market.supplyRateMantissa;
}
