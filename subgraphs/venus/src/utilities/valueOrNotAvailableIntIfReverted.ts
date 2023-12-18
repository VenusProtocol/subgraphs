import { BigInt, ethereum } from '@graphprotocol/graph-ts';

import { NOT_AVAILABLE_BIG_INT } from '../constants';

// checks if a call reverted, in case it is we return -1 to indicate the wanted value is not available
function valueOrNotAvailableIntIfReverted(callResult: ethereum.CallResult<BigInt>): BigInt {
  return callResult.reverted ? NOT_AVAILABLE_BIG_INT : callResult.value;
}

export default valueOrNotAvailableIntIfReverted;
