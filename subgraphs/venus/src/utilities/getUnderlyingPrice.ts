import { Address, BigDecimal } from '@graphprotocol/graph-ts';

import { getTokenPrice } from './getTokenPrice';
import { zeroBigDecimal } from '../constants';

class GetUnderlyingPriceReturn {
  underlyingPrice: BigDecimal;
  underlyingPriceUsd: BigDecimal;
}

export function getUnderlyingPrice(
  address: string,
  underlyingDecimals: i32,
): GetUnderlyingPriceReturn {
  let underlyingPriceUsd = zeroBigDecimal;
  let underlyingPrice = zeroBigDecimal;

  const contractAddress = Address.fromString(address);
  underlyingPrice = getTokenPrice(contractAddress, underlyingDecimals);
  underlyingPriceUsd = underlyingPrice.truncate(underlyingDecimals);

  return { underlyingPrice, underlyingPriceUsd };
}
