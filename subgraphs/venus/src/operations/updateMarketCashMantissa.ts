import { Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';

export function updateMarketCashMantissa(market: Market, vTokenContract: VToken): void {
  market.cashMantissa = vTokenContract.getCash();
}
