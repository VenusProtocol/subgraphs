import { Address, BigDecimal } from '@graphprotocol/graph-ts';

import { vBnbAddress, vUsdcAddress } from '../constants/addresses';
import { zeroBD } from '../utilities/exponentToBigDecimal';
import { getBnbPriceInUsd } from './getBnbPriceInUsd';
import { getTokenPrice } from './getTokenPrice';

class GetUnderlyingPriceReturn {
  underlyingPrice: BigDecimal;
  underlyingPriceUsd: BigDecimal;
}

export function getUnderlyingPrice(
  address: string,
  underlyingDecimals: i32,
): GetUnderlyingPriceReturn {
  let underlyingPriceUsd: BigDecimal;
  let underlyingPrice = zeroBD;

  const contractAddress = Address.fromString(address);
  const tokenPriceUSD = getTokenPrice(contractAddress, underlyingDecimals);

  const bnbPriceInUsd = getBnbPriceInUsd();

  // if vBNB, we only update USD price
  if (address == vBnbAddress.toHexString()) {
    underlyingPriceUsd = bnbPriceInUsd.truncate(underlyingDecimals);
    return { underlyingPrice, underlyingPriceUsd };
  }

  if (bnbPriceInUsd.equals(BigDecimal.zero()) || tokenPriceUSD.equals(BigDecimal.zero())) {
    underlyingPrice = BigDecimal.zero();
  } else {
    underlyingPrice = tokenPriceUSD.div(bnbPriceInUsd).truncate(underlyingDecimals);
  }

  // if USDC, we only update BNB price
  if (address == vUsdcAddress.toHexString()) {
    underlyingPriceUsd = BigDecimal.fromString('1');
  } else {
    underlyingPriceUsd = tokenPriceUSD.truncate(underlyingDecimals);
  }

  return { underlyingPrice, underlyingPriceUsd };
}
