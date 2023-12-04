import { assert, describe, test } from 'matchstick-as/assembly';

import { handleFunctionRegistryChanged } from '../../src/mappings/omnichainExecutorOwner';
import { createFunctionRegistryChangedEvent } from './events';

describe('OmniGovernanceOwner', () => {
  test('should add function to FunctionRegistry', () => {
    const functionRegistryChangedEvent = createFunctionRegistryChangedEvent(
      'acceptAdmin(address)',
      true,
    );

    handleFunctionRegistryChanged(functionRegistryChangedEvent);
    assert.fieldEquals('FunctionRegistry', 'acceptAdmin(address)', 'id', 'acceptAdmin(address)');
    assert.entityCount('FunctionRegistry', 1);
  });

  test('should remove function to FunctionRegistry', () => {
    const functionRegistryChangedEvent = createFunctionRegistryChangedEvent(
      'acceptAdmin(address)',
      false,
    );

    handleFunctionRegistryChanged(functionRegistryChangedEvent);
    assert.entityCount('FunctionRegistry', 0);
  });
});
