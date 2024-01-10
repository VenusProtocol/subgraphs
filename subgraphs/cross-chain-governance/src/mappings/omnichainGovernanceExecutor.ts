import {
  ProposalCancelled,
  ProposalExecuted,
  ProposalQueued,
  ProposalReceived,
  ReceivePayloadFailed,
  SetMaxDailyReceiveLimit,
  TimelockAdded,
} from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';
import { createFailedPayload, createProposal } from '../operations/create';
import { getProposal } from '../operations/get';
import { getOrCreateGovernance, getOrCreateGovernanceRoute } from '../operations/getOrCreate';

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

export function handleProposalCancelled(event: ProposalCancelled): void {
  const proposal = getProposal(event.params.id);
  proposal.cancelled = true;
  proposal.save();
}

export function handleReceivePayloadFailed(event: ReceivePayloadFailed): void {
  createFailedPayload(event);
}

export function handleTimelockAdded(event: TimelockAdded): void {
  getOrCreateGovernanceRoute(event.params.routeType, event.params.timelock);
}
