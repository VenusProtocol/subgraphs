import { Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { valueOrNotAvailableIntIfReverted } from '../utilities';

/* Exchange rate explanation
  In Practice
  - If you call the vDAI contract on bscscan it comes back (2.0 * 10^26)
  - If you call the vUSDC contract on bscscan it comes back (2.0 * 10^14)
  - The real value is ~0.02. So vDAI is off by 10^28, and vUSDC 10^16
  How to calculate for tokens with different decimals
  - Must div by tokenDecimals, 10^market.underlyingDecimals
  - Must multiply by vtokenDecimals, 10^8
  - Must div by mantissa, 10^18
*/
export function updateMarketExchangeRate(market: Market, vTokenContract: VToken): void {
  market.exchangeRateMantissa = valueOrNotAvailableIntIfReverted(vTokenContract.try_exchangeRateStored(), 'vBEP20 try_exchangeRateStored()');
}
