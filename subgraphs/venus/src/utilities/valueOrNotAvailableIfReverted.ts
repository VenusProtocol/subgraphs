import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts';

import { NOT_AVAILABLE_BIG_INT } from '../constants';
import { nullAddress } from '../constants/addresses';

// checks if a call reverted, in case it is we return -1 to indicate the wanted value is not available
export function valueOrNotAvailableIntIfReverted(
  callResult: ethereum.CallResult<BigInt>,
  callName: string,
): BigInt {
  if (callResult.reverted) {
    log.error('***CALL FAILED*** : {} reverted', [callName]);
    return NOT_AVAILABLE_BIG_INT;
  }
  return callResult.value;
}

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
