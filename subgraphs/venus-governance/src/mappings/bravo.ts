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
  VoteCast,
} from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';
import { CRITICAL, FAST_TRACK, NORMAL } from '../constants';
import { BIGINT_ZERO } from '../constants';
import associateSourceAndRemoteProposals from '../operations/associateSourceAndRemoteProposals';
import { createProposal, createVoteBravo } from '../operations/create';
import { getGovernanceEntity } from '../operations/get';
import { getOrCreateDelegate } from '../operations/getOrCreate';
import {
  updateBravoProposalVotes,
  updateGovernanceEntity,
  updateProposalCanceled,
  updateProposalExecuted,
  updateProposalQueued,
} from '../operations/update';

export function handleProposalCreated(event: ProposalCreated): void {
  getOrCreateDelegate(event.params.proposer);
  createProposal<ProposalCreated>(event);
}

export function handleProposalCreatedV2(event: ProposalCreatedV2): void {
  getOrCreateDelegate(event.params.proposer);
  const proposal = createProposal<ProposalCreatedV2>(event);
  const indexProposalTypeConstant = [NORMAL, FAST_TRACK, CRITICAL];
  proposal.type = indexProposalTypeConstant[event.params.proposalType];
  proposal.save();
}

export function handleProposalCanceled(event: ProposalCanceled): void {
  updateProposalCanceled(event);
}

export function handleProposalQueued(event: ProposalQueued): void {
  updateProposalQueued<ProposalQueued>(event);
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  updateProposalExecuted<ProposalExecuted>(event);
  associateSourceAndRemoteProposals(event);
}

export function handleBravoVoteCast(event: VoteCast): void {
  if (event.params.votes.gt(BIGINT_ZERO)) {
    createVoteBravo(event);
    updateBravoProposalVotes(event.params.proposalId, event.params.votes, event.params.support);
  }
}

export function handleNewImplementation(event: NewImplementation): void {
  const governance = getGovernanceEntity();
  governance.implementation = event.params.newImplementation;
  governance.save();
  updateGovernanceEntity();
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
