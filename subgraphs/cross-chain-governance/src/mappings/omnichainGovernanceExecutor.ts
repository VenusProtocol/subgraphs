import {
  NewGuardian,
  ProposalCanceled,
  ProposalExecuted,
  ProposalQueued,
  ProposalReceived,
  ReceivePayloadFailed,
  RetryMessageSuccess,
  SetMaxDailyReceiveLimit,
  SetMinDstGas,
  SetPrecrime,
  SetSrcChainId,
  TimelockAdded,
} from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';
import { createFailedPayload, createProposal } from '../operations/create';
import { getProposal } from '../operations/get';
import {
  getOrCreateDestinationChain,
  getOrCreateGovernance,
  getOrCreateGovernanceRoute,
} from '../operations/getOrCreate';
import { removeFailedPayload } from '../operations/remove';

export function handleNewGuardian(event: NewGuardian): void {
  const governance = getOrCreateGovernance();
  governance.guardian = event.params.newGuardian;
  governance.save();
}

export function handleSetMaxDailyReceiveLimit(event: SetMaxDailyReceiveLimit): void {
  const governance = getOrCreateGovernance();
  governance.maxDailyReceiveLimit = event.params.newMaxLimit;
  governance.save();
}

export function handleProposalReceived(event: ProposalReceived): void {
  createProposal(event);
}

export function handleProposalQueued(event: ProposalQueued): void {
  const proposal = getProposal(event.params.id);
  proposal.queued = true;
  proposal.executionEta = event.params.eta;
  proposal.save();
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  const proposal = getProposal(event.params.id);
  proposal.executed = true;
  proposal.save();
}

export function handleProposalCanceled(event: ProposalCanceled): void {
  const proposal = getProposal(event.params.id);
  proposal.canceled = true;
  proposal.save();
}

export function handleReceivePayloadFailed(event: ReceivePayloadFailed): void {
  createFailedPayload(event);
}

export function handleRetryMessageSuccess(event: RetryMessageSuccess): void {
  removeFailedPayload(event);
}

export function handleTimelockAdded(event: TimelockAdded): void {
  getOrCreateGovernanceRoute(event.params.routeType, event.params.newTimelock);
}

export function handlePaused(): void {
  const governance = getOrCreateGovernance();
  governance.paused = true;
  governance.save();
}

export function handleUnpaused(): void {
  const governance = getOrCreateGovernance();
  governance.paused = false;
  governance.save();
}

export function handleSetMinDstGas(event: SetMinDstGas): void {
  const destinationChain = getOrCreateDestinationChain(event.params._dstChainId);
  destinationChain.minGas = event.params._minDstGas;
  destinationChain.packetType = event.params._type;
  destinationChain.save();
}

export function handleSetPrecrime(event: SetPrecrime): void {
  const governance = getOrCreateGovernance();
  governance.precrime = event.params.precrime;
  governance.save();
}

export function handleSetSrcChainId(event: SetSrcChainId): void {
  const governance = getOrCreateGovernance();
  governance.srcChainId = event.params.newSrcChainId;
  governance.save();
}
