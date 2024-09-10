import { Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { updateMarketBorrowRate } from './updateMarketBorrowRate';
import { updateMarketExchangeRate } from './updateMarketExchangeRate';
import { updateMarketSupplyRate } from './updateMarketSupplyRate';

// if an event updated the market reserves, it means we need to update the market rates that depend on it:
// borrow rate, supply rate and the exchange rate
export function updateMarketRates(market: Market, vTokenContract: VToken): void {
  updateMarketBorrowRate(market, vTokenContract);
  updateMarketSupplyRate(market, vTokenContract);
  updateMarketExchangeRate(market, vTokenContract);
}
