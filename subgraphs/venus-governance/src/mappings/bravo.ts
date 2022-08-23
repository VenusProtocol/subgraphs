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

export const handleProposalCreated = (event: ProposalCreated) => {};

export const handleProposalCanceled = (event: ProposalCanceled) => {};

export const handleProposalQueued = (event: ProposalQueued) => {};

export const handleProposalExecuted = (event: ProposalExecuted) => {};

export const handleVoteCast = (event: VoteCast) => {};

export const handleVotingDelaySet = (event: VotingDelaySet) => {};

export const handleVotingPeriodSet = (event: VotingPeriodSet) => {};

export const handleNewImplementation = (event: NewImplementation) => {};

export const handleProposalThresholdSet = (event: ProposalThresholdSet) => {};

export const handleNewPendingAdmin = (event: NewPendingAdmin) => {};

export const handleNewAdmin = (event: NewAdmin) => {};

export const handleNewGuardian = (event: NewGuardian) => {};

export const handleProposalMaxOperationsUpdated = (event: ProposalMaxOperationsUpdated) => {};
