import { store } from '@graphprotocol/graph-ts';

import { getTrustedRemoteId } from '../utilities/ids';

export const removeTrustedRemote = (remoteChainId: i32): void => {
  const id = getTrustedRemoteId(remoteChainId);
  store.remove('TrustedRemote', id.toHex());
};
