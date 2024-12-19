import { ethereum } from '@graphprotocol/graph-ts';

// checks if a call reverted, in case it is we return false to indicate the wanted value is not available
function valueOrFalseIfReverted(callResult: ethereum.CallResult<boolean>): boolean {
  return callResult.reverted ? false : callResult.value;
}

export default valueOrFalseIfReverted;
