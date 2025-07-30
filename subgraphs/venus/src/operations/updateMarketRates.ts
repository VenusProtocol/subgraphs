import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { createMarketRatesData } from './create';
import { updateMarketBorrowRate } from './updateMarketBorrowRate';
import { updateMarketExchangeRate } from './updateMarketExchangeRate';
import { updateMarketSupplyRate } from './updateMarketSupplyRate';

// if an event updated the market reserves, it means we need to update the market rates that depend on it:
// borrow rate, supply rate and the exchange rate
export function updateMarketRates(
  market: Market,
  vTokenContract: VToken,
  underlyingPriceCents: BigInt,
  blockNumber: BigInt,
): void {
  const borrowRate = updateMarketBorrowRate(market, vTokenContract);
  const supplyRate = updateMarketSupplyRate(market, vTokenContract);
  const exchangeRate = updateMarketExchangeRate(market, vTokenContract);

  createMarketRatesData(
    Address.fromBytes(market.address),
    blockNumber,
    exchangeRate,
    supplyRate,
    borrowRate,
    underlyingPriceCents,
  );
}
