import {
  ProposalCancelled,
  ProposalExecuted,
  ProposalQueued,
  ProposalReceived,
  SetMaxDailyReceiveLimit,
  TimelockAdded,
} from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';
import { createProposal } from '../operations/create';
import { getProposal } from '../operations/get';
import { getOrCreateGovernance, getOrCreateTimelock } from '../operations/getOrCreate';

export function handleSetMaxDailyReceiveLimit(event: SetMaxDailyReceiveLimit) {
  const governance = getOrCreateGovernance();
  governance.maxDailyReceiveLimit = event.params.newMaxLimit;
  governance.save();
}

export function handleProposalReceived(event: ProposalReceived) {
  createProposal(event);
}

export function handleProposalQueued(event: ProposalQueued) {
  const proposal = getProposal(event.params.id);
  proposal.queued = true;
  proposal.executionEta = event.params.eta;
  proposal.save();
}

export function handleProposalExecuted(event: ProposalExecuted) {
  const proposal = getProposal(event.params.id);
  proposal.executed = true;
  proposal.save();
}

export function handleProposalCancelled(event: ProposalCancelled) {
  const proposal = getProposal(event.params.id);
  proposal.cancelled = true;
  proposal.save();
}

export function handleTimelockAdded(event: TimelockAdded) {
  getOrCreateTimelock(event.params.routeType, event.params.timelock);
}
