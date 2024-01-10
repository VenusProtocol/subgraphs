import {
  ClearPayload,
  ExecuteRemoteProposal,
  SetTrustedRemoteAddress,
  StorePayload,
  UpdateValidChainId,
} from '../../generated/OmnichainProposalSender/OmnichainProposalSender';
import { nullAddress } from '../constants/addresses';
import { createRemoteProposal } from '../operations/create';
import { getRemoteProposal } from '../operations/get';
import { getOrCreateTrustedRemote } from '../operations/getOrCreate';
import { getTrustedRemoteId } from '../utilities/ids';

export function handleSetTrustedRemoteAddress(event: SetTrustedRemoteAddress) {
  getOrCreateTrustedRemote(event.params.remoteChainId, event.params.remoteAddress);
}

export function handleExecuteRemoteProposal(event: ExecuteRemoteProposal) {
  const remoteProposal = createRemoteProposal(event);
  remoteProposal.executed = true;
  remoteProposal.save();
}

export function handleClearPayload(event: ClearPayload) {
  const remoteProposal = getRemoteProposal(getTrustedRemoteId(event.params.nonce));
  remoteProposal.executed = true;
  remoteProposal.save();
}

export function handleStorePayload(event: StorePayload) {
  const remoteProposal = getRemoteProposal(getTrustedRemoteId(event.params.nonce));
  remoteProposal.executed = false;
  remoteProposal.save();
}

export function handleUpdatedValidChainId(event: UpdateValidChainId) {
  const trustedRemote = getOrCreateTrustedRemote(event.params.chainId, nullAddress);
  trustedRemote.active = event.params.isAdded;
  trustedRemote.save();
}
