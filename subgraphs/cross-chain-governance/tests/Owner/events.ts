import { ByteArray, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import { FunctionRegistryChanged as FunctionRegistryChangedEvent } from '../../generated/OmnichainExecutorOwner/OmnichainExecutorOwner';

export const createFunctionRegistryChangedEvent = (
  functionSignature: string,
  active: boolean,
): FunctionRegistryChangedEvent => {
  const event = changetype<FunctionRegistryChangedEvent>(newMockEvent());

  event.parameters = [];
  const signatureParam = new ethereum.EventParam(
    'signature',
    ethereum.Value.fromBytes(Bytes.fromByteArray(ByteArray.fromUTF8(functionSignature))),
  );
  event.parameters.push(signatureParam);

  const activeParam = new ethereum.EventParam('active', ethereum.Value.fromBoolean(active));
  event.parameters.push(activeParam);

  return event;
};
