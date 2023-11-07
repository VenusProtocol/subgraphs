import { FunctionRegistryChanged } from '../../generated/OmnichainExecutorOwner/OmnichainExecutorOwner';
import { deleteFunctionRegistry } from './delete';
import { getOrCreateFunctionRegistry } from './getOrCreate';

export function handleFunctionRegistryChanged(event: FunctionRegistryChanged) {
  if (event.params.isRemoved) {
    getOrCreateFunctionRegistry(event.params.signature);
  } else {
    deleteFunctionRegistry(event.params.signature);
  }
}
