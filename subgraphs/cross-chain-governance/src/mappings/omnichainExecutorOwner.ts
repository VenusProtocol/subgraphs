import { FunctionRegistryChanged } from '../../generated/OmnichainExecutorOwner/OmnichainExecutorOwner';
import { getOrCreateFunctionRegistry } from '../operations/getOrCreate';
import { removeFunctionRegistry } from '../operations/remove';

export function handleFunctionRegistryChanged(event: FunctionRegistryChanged): void {
  if (event.params.active) {
    getOrCreateFunctionRegistry(event.params.signature);
  } else {
    removeFunctionRegistry(event.params.signature);
  }
}
