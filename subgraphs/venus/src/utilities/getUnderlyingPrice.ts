import { Address, BigDecimal } from '@graphprotocol/graph-ts';

import { zeroBD } from '../utilities/exponentToBigDecimal';
import { getTokenPrice } from './getTokenPrice';

class GetUnderlyingPriceReturn {
  underlyingPrice: BigDecimal;
  underlyingPriceUsd: BigDecimal;
}

export function getUnderlyingPrice(
  address: string,
  underlyingDecimals: i32,
): GetUnderlyingPriceReturn {
  let underlyingPriceUsd = zeroBD;
  let underlyingPrice = zeroBD;

  const contractAddress = Address.fromString(address);
  underlyingPrice = getTokenPrice(contractAddress, underlyingDecimals);
  underlyingPriceUsd = underlyingPrice.truncate(underlyingDecimals);

  // if USDC, we only update BNB price
  if (address == vUsdcAddress.toHexString()) {
    underlyingPriceUsd = BigDecimal.fromString('1');
  }

  return { underlyingPrice, underlyingPriceUsd };
}
