/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-empty-function */
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
import { ACTIVE, CANCELLED, PENDING } from '../constants';
import { createProposal, createVoteBravo } from '../operations/create';
import { getGovernanceEntity, getProposal } from '../operations/get';
import { getOrCreateDelegate } from '../operations/getOrCreate';
import {
  updateProposalExecuted,
  updateProposalQueued,
  updateProposalStatus,
} from '../operations/update';

export const handleProposalCreated = (event: ProposalCreated): void => {
  getOrCreateDelegate(event.params.proposer.toHexString());
  createProposal<ProposalCreated>(event);
};

export const handleProposalCanceled = (event: ProposalCanceled): void => {
  const proposalId = event.params.id.toString();
  updateProposalStatus(proposalId, CANCELLED);
};

export const handleProposalQueued = (event: ProposalQueued): void => {
  updateProposalQueued<ProposalQueued>(event);
};

export const handleProposalExecuted = (event: ProposalExecuted): void => {
  updateProposalExecuted<ProposalExecuted>(event);
};

export const handleVoteCast = (event: VoteCast): void => {
  createVoteBravo(event);
  const proposalId = event.params.proposalId.toString();
  const proposal = getProposal(proposalId);
  if (proposal.status == PENDING) {
    updateProposalStatus(proposalId, ACTIVE);
  }
};

export const handleVotingDelaySet = (event: VotingDelaySet): void => {
  const governance = getGovernanceEntity();
  governance.votingDelay = event.params.newVotingDelay;
  governance.save();
};

export const handleVotingPeriodSet = (event: VotingPeriodSet): void => {
  const governance = getGovernanceEntity();
  governance.votingPeriod = event.params.newVotingPeriod;
  governance.save();
};

export const handleNewImplementation = (event: NewImplementation): void => {
  const governance = getGovernanceEntity();
  governance.implementation = event.params.newImplementation;
  governance.save();
};

export const handleProposalThresholdSet = (event: ProposalThresholdSet): void => {
  const governance = getGovernanceEntity();
  governance.proposalThreshold = event.params.newProposalThreshold;
  governance.save();
};

export const handleNewPendingAdmin = (event: NewPendingAdmin): void => {
  const governance = getGovernanceEntity();
  governance.pendingAdmin = event.params.newPendingAdmin;
  governance.save();
};

export const handleNewAdmin = (event: NewAdmin): void => {
  const governance = getGovernanceEntity();
  governance.admin = event.params.newAdmin;
  governance.pendingAdmin = null;
  governance.save();
};

export const handleNewGuardian = (event: NewGuardian): void => {
  const governance = getGovernanceEntity();
  governance.guardian = event.params.newGuardian;
  governance.save();
};

export const handleProposalMaxOperationsUpdated = (event: ProposalMaxOperationsUpdated): void => {};
