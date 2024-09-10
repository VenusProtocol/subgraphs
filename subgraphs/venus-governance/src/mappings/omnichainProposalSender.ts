import { Address, ByteArray, Bytes, crypto } from '@graphprotocol/graph-ts';

import {
  ClearPayload,
  ExecuteRemoteProposal,
  NewAccessControlManager,
  SetMaxDailyLimit,
  SetTrustedRemoteAddress,
  StorePayload,
  TrustedRemoteRemoved,
} from '../../generated/OmnichainProposalSender/OmnichainProposalSender';
import {
  createRemoteProposalFromExecuteRemoteProposal,
  createRemoteProposalFromStorePayloadEvent,
} from '../operations/create';
import { getOmnichainProposalSenderEntity, getRemoteProposal } from '../operations/get';
import {
  getOrCreateMaxDailyLimit,
  getOrCreateTransaction,
  getOrCreateTrustedRemote,
} from '../operations/getOrCreate';
import { removeTrustedRemote } from '../operations/remove';

export function handleSetTrustedRemoteAddress(event: SetTrustedRemoteAddress): void {
  getOrCreateTrustedRemote(
    event.params.remoteChainId,
    Address.fromString(event.params.newRemoteAddress.toHexString().slice(0, 42)),
  );
}

export function handleExecuteRemoteProposal(event: ExecuteRemoteProposal): void {
  const remoteProposal = createRemoteProposalFromExecuteRemoteProposal(event);
  remoteProposal.save();
}

export function handleClearPayload(event: ClearPayload): void {
  const remoteProposal = getRemoteProposal(event.params.proposalId);
  // If receipt includes a withdrawn even the proposal was withdrawn
  // otherwise it execution was retried and successful
  const transaction = getOrCreateTransaction(event);
  if (event.receipt) {
    const withdrawn = event.receipt!.logs.filter(v => {
      const topic = Bytes.fromByteArray(
        crypto.keccak256(ByteArray.fromUTF8('FallbackWithdraw(indexed address,uint256)')),
      );
      return v.topics.includes(topic);
    });
    if (withdrawn.length > 0) {
      remoteProposal.withdrawn = transaction.id;
    }
  } else {
    remoteProposal.executed = transaction.id;
  }
  remoteProposal.save();
}

export function handleStorePayload(event: StorePayload): void {
  const remoteProposal = createRemoteProposalFromStorePayloadEvent(event);
  remoteProposal.save();
}

export function handleNewAccessControlManager(event: NewAccessControlManager): void {
  const omnichainProposalSender = getOmnichainProposalSenderEntity();
  omnichainProposalSender.accessControlManagerAddress = event.params.newAccessControlManager;
  omnichainProposalSender.save();
}

export function handlePaused(): void {
  const omnichainProposalSender = getOmnichainProposalSenderEntity();
  omnichainProposalSender.paused = true;
  omnichainProposalSender.save();
}

export function handleSetMaxDailyLimit(event: SetMaxDailyLimit): void {
  const result = getOrCreateMaxDailyLimit(event.params.chainId);
  const maxDailyLimit = result.entity;
  maxDailyLimit.max = event.params.newMaxLimit;
  maxDailyLimit.save();
}

export function handleTrustedRemoteRemoved(event: TrustedRemoteRemoved): void {
  removeTrustedRemote(event.params.chainId);
}

export function handleUnpaused(): void {
  const omnichainProposalSender = getOmnichainProposalSenderEntity();
  omnichainProposalSender.paused = false;
  omnichainProposalSender.save();
}
