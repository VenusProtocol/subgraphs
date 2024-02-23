import { Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { exponentToBigInt } from '../utilities/exponentToBigInt';

export function updateMarketTotalSupplyMantissa(market: Market, vTokenContract: VToken): void {
  market.totalSupplyMantissa = vTokenContract
    .totalSupply()
    .times(market.exchangeRateMantissa)
    .div(exponentToBigInt(18));
}
