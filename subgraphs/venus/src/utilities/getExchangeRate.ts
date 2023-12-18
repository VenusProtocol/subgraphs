import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import { VToken } from '../../generated/templates/VToken/VToken';
import valueOrNotAvailableIntIfReverted from './valueOrNotAvailableIntIfReverted';

export function getExchangeRate(marketAddress: Address): BigInt {
  const vTokenContract = VToken.bind(marketAddress);
  const tryExchangeRateStored = vTokenContract.try_exchangeRateStored();
  if (tryExchangeRateStored.reverted) {
    log.warning('Failed to get exchange rate for {}', [marketAddress.toHexString()]);
  }
  return valueOrNotAvailableIntIfReverted(tryExchangeRateStored);
}

export default getExchangeRate;
