import { Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { valueOrNotAvailableIntIfReverted } from '../utilities';

export function updateMarketBorrowRate(market: Market, vTokenContract: VToken): void {
  market.borrowRateMantissa = valueOrNotAvailableIntIfReverted(vTokenContract.try_borrowRatePerBlock(), 'vBEP20 try_borrowRatePerBlock()');
}
