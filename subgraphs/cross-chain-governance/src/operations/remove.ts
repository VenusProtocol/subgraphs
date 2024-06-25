import { Bytes, store } from '@graphprotocol/graph-ts';

import { RetryMessageSuccess } from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';
import { getFailedPayloadId } from '../utilities/ids';

export const removeFunctionRegistry = (signature: Bytes): void => {
  store.remove('FunctionRegistry', signature.toHexString());
};

export const removeFailedPayload = (event: RetryMessageSuccess): void => {
  store.remove('FailedPayload', getFailedPayloadId(event.params._nonce));
};
