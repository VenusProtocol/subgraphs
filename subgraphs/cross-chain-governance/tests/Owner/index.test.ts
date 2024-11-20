import { ByteArray, Bytes } from '@graphprotocol/graph-ts';
import { assert, describe, test } from 'matchstick-as/assembly';

import { handleFunctionRegistryChanged } from '../../src/mappings/omnichainExecutorOwner';
import { createFunctionRegistryChangedEvent } from './events';

describe('OmniGovernanceOwner', () => {
  test('should add function to FunctionRegistry', () => {
    const functionRegistryChangedEvent = createFunctionRegistryChangedEvent('acceptAdmin(address)', true);

    handleFunctionRegistryChanged(functionRegistryChangedEvent);

    assert.fieldEquals('FunctionRegistry', Bytes.fromByteArray(ByteArray.fromUTF8('acceptAdmin(address)')).toHexString(), 'signature', '0x61636365707441646d696e286164647265737329');
    assert.entityCount('FunctionRegistry', 1);
  });

  test('should remove function to FunctionRegistry', () => {
    const functionRegistryChangedEvent = createFunctionRegistryChangedEvent('acceptAdmin(address)', false);

    handleFunctionRegistryChanged(functionRegistryChangedEvent);
    assert.entityCount('FunctionRegistry', 0);
  });
});
