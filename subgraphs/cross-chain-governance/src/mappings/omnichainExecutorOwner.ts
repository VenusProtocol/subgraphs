import { FunctionRegistryChanged } from '../../generated/OmnichainExecutorOwner/OmnichainExecutorOwner';
import { deleteFunctionRegistry } from '../operations/delete';
import { getOrCreateFunctionRegistry } from '../operations/getOrCreate';

export function handleFunctionRegistryChanged(event: FunctionRegistryChanged): void {
  if (event.params.active) {
    getOrCreateFunctionRegistry(event.params.signature);
  } else {
    deleteFunctionRegistry(event.params.signature);
  }
}
