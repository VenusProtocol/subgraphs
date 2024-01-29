import { Address, ethereum, log } from '@graphprotocol/graph-ts';

import { nullAddress } from '../constants/addresses';

// checks if a call reverted, in case it is we return 0x000.. to indicate the wanted value is not available
export function valueOrNotAvailableAddressIfReverted(
  callResult: ethereum.CallResult<Address>,
  callName: string,
): Address {
  if (callResult.reverted) {
    log.error('***CALL FAILED*** : {} reverted', [callName]);
    return nullAddress;
  }
  return callResult.value;
}
