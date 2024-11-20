import { BigInt, ethereum, log } from '@graphprotocol/graph-ts';

import { NOT_AVAILABLE_BIG_INT } from '../constants';

// checks if a call reverted, in case it is we return -1 to indicate the wanted value is not available
export function valueOrNotAvailableIntIfReverted(callResult: ethereum.CallResult<BigInt>, callName: string): BigInt {
  if (callResult.reverted) {
    log.error('***CALL FAILED*** : {} reverted', [callName]);
    return NOT_AVAILABLE_BIG_INT;
  }
  return callResult.value;
}

export default valueOrNotAvailableIntIfReverted;
