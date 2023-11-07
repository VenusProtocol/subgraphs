import { store } from '@graphprotocol/graph-ts';

export const deleteFunctionRegistry = (signature: string) => {
  store.remove('FunctionRegistry', signature);
};
