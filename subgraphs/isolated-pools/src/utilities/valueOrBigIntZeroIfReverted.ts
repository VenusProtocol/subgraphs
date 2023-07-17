import { BigInt, ethereum } from '@graphprotocol/graph-ts';

import { zeroBigInt32 } from '../constants';

function valueOrBigIntZeroIfReverted(callResult: ethereum.CallResult<BigInt>): BigInt {
  return callResult.reverted ? zeroBigInt32 : callResult.value;
}

export default valueOrBigIntZeroIfReverted;
