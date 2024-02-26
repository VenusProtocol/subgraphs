import { Address, ethereum } from '@graphprotocol/graph-ts';

import { nullAddress } from '../constants/addresses';

// checks if a call reverted, in case it is we return -1 to indicate the wanted value is not available
function valueOrNotAvailableAddressIfReverted(callResult: ethereum.CallResult<Address>): Address {
  return callResult.reverted ? nullAddress : callResult.value;
}

export default valueOrNotAvailableAddressIfReverted;
