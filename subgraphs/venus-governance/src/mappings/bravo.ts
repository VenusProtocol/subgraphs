import { ProposalCreated as ProposalCreatedV2 } from '../../generated/GovernorBravoDelegate2/GovernorBravoDelegate2';
import {
  NewAdmin,
  NewGuardian,
  NewImplementation,
  NewPendingAdmin,
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalMaxOperationsUpdated,
  ProposalQueued,
  ProposalThresholdSet,
  VoteCast,
  VotingDelaySet,
  VotingPeriodSet,
} from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';
import { ACTIVE, CANCELLED, CRITICAL, FAST_TRACK, NORMAL, PENDING } from '../constants';
import { createProposal, createVoteBravo } from '../operations/create';
import { getGovernanceEntity, getProposal } from '../operations/get';
import { getOrCreateDelegate } from '../operations/getOrCreate';
import {
  updateProposalExecuted,
  updateProposalQueued,
  updateProposalStatus,
} from '../operations/update';

export function handleProposalCreated(event: ProposalCreated): void {
  getOrCreateDelegate(event.params.proposer.toHexString());
  createProposal<ProposalCreated>(event);
}

export function handleProposalCreatedV2(event: ProposalCreatedV2): void {
  getOrCreateDelegate(event.params.proposer.toHexString());
  const proposal = createProposal<ProposalCreatedV2>(event);
  const indexProposalTypeConstant = [NORMAL, FAST_TRACK, CRITICAL];
  proposal.type = indexProposalTypeConstant[event.params.proposalType];
  proposal.save();
}

export function handleProposalCanceled(event: ProposalCanceled): void {
  const proposalId = event.params.id.toString();
  updateProposalStatus(proposalId, CANCELLED);
}

export function handleProposalQueued(event: ProposalQueued): void {
  updateProposalQueued<ProposalQueued>(event);
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  updateProposalExecuted<ProposalExecuted>(event);
}

export function handleVoteCast(event: VoteCast): void {
  createVoteBravo(event);
  const proposalId = event.params.proposalId.toString();
  const proposal = getProposal(proposalId);
  if (proposal.status == PENDING) {
    updateProposalStatus(proposalId, ACTIVE);
  }
}

export function handleVotingDelaySet(event: VotingDelaySet): void {
  const governance = getGovernanceEntity();
  governance.votingDelay = event.params.newVotingDelay;
  governance.save();
}

export function handleVotingPeriodSet(event: VotingPeriodSet): void {
  const governance = getGovernanceEntity();
  governance.votingPeriod = event.params.newVotingPeriod;
  governance.save();
}

export function handleNewImplementation(event: NewImplementation): void {
  const governance = getGovernanceEntity();
  governance.implementation = event.params.newImplementation;
  governance.save();
}

export function handleProposalThresholdSet(event: ProposalThresholdSet): void {
  const governance = getGovernanceEntity();
  governance.proposalThreshold = event.params.newProposalThreshold;
  governance.save();
}

export function handleNewPendingAdmin(event: NewPendingAdmin): void {
  const governance = getGovernanceEntity();
  governance.pendingAdmin = event.params.newPendingAdmin;
  governance.save();
}

export function handleNewAdmin(event: NewAdmin): void {
  const governance = getGovernanceEntity();
  governance.admin = event.params.newAdmin;
  governance.pendingAdmin = null;
  governance.save();
}

export function handleNewGuardian(event: NewGuardian): void {
  const governance = getGovernanceEntity();
  governance.guardian = event.params.newGuardian;
  governance.save();
}

export function handleProposalMaxOperationsUpdated(event: ProposalMaxOperationsUpdated): void {
  const governance = getGovernanceEntity();
  governance.proposalMaxOperations = event.params.newMaxOperations;
  governance.save();
}
