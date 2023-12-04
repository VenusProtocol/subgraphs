import { store } from '@graphprotocol/graph-ts';

export const deleteFunctionRegistry = (signature: string): void => {
  store.remove('FunctionRegistry', signature);
};
