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
import { CANCELLED } from '../constants';
import { createProposal } from '../operations/create';
import { getOrCreateDelegate } from '../operations/getOrCreate';
import { updateProposalStatus, updateProposalQueued } from '../operations/update';

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

export const handleProposalExecuted = (event: ProposalExecuted): void => {};

export const handleVoteCast = (event: VoteCast): void => {};

export const handleVotingDelaySet = (event: VotingDelaySet): void => {};

export const handleVotingPeriodSet = (event: VotingPeriodSet): void => {};

export const handleNewImplementation = (event: NewImplementation): void => {};

export const handleProposalThresholdSet = (event: ProposalThresholdSet): void => {};

export const handleNewPendingAdmin = (event: NewPendingAdmin): void => {};

export const handleNewAdmin = (event: NewAdmin): void => {};

export const handleNewGuardian = (event: NewGuardian): void => {};

export const handleProposalMaxOperationsUpdated = (event: ProposalMaxOperationsUpdated): void => {};
