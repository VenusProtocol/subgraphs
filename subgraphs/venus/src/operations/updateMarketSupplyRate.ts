import { Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { valueOrNotAvailableIntIfReverted } from '../utilities';

export function updateMarketSupplyRate(market: Market, vTokenContract: VToken): void {
  // This fails on only the first call to cZRX. It is unclear why, but otherwise it works.
  // So we handle it like this.
  market.supplyRateMantissa = valueOrNotAvailableIntIfReverted(vTokenContract.try_supplyRatePerBlock(), 'vBEP20 try_supplyRatePerBlock()');
}
