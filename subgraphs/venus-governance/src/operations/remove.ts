import { store } from '@graphprotocol/graph-ts';

import { getTrustedRemoteId } from '../utilities/ids';

export const removeTrustedRemote = (layerZeroChainId: i32): void => {
  const id = getTrustedRemoteId(layerZeroChainId);
  store.remove('TrustedRemote', id.toHex());
};
