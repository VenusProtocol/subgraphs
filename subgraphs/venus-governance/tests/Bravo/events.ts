import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  NewAdmin,
  NewGuardian,
  NewImplementation,
  NewPendingAdmin,
  ProposalThresholdSet,
  VotingDelaySet,
  VotingPeriodSet,
} from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';

export function createNewVotingDelayEvent(
  governanceAddress: Address,
  oldVotingDelay: BigInt,
  newVotingDelay: BigInt,
): VotingDelaySet {
  const event = changetype<VotingDelaySet>(newMockEvent());
  event.address = governanceAddress;
  event.parameters = [];

  const oldVotingDelayParam = new ethereum.EventParam(
    'oldVotingDelay',
    ethereum.Value.fromUnsignedBigInt(oldVotingDelay),
  );
  event.parameters.push(oldVotingDelayParam);

  const newVotingDelayParam = new ethereum.EventParam(
    'newVotingDelay',
    ethereum.Value.fromUnsignedBigInt(newVotingDelay),
  );
  event.parameters.push(newVotingDelayParam);

  return event;
}

export function createNewVotingPeriodEvent(
  governanceAddress: Address,
  oldVotingPeriod: BigInt,
  newVotingPeriod: BigInt,
): VotingPeriodSet {
  const event = changetype<VotingPeriodSet>(newMockEvent());
  event.address = governanceAddress;
  event.parameters = [];

  const oldVotingPeriodParam = new ethereum.EventParam(
    'oldVotingPeriod',
    ethereum.Value.fromUnsignedBigInt(oldVotingPeriod),
  );
  event.parameters.push(oldVotingPeriodParam);

  const newVotingPeriodParam = new ethereum.EventParam(
    'newVotingPeriod',
    ethereum.Value.fromUnsignedBigInt(newVotingPeriod),
  );
  event.parameters.push(newVotingPeriodParam);

  return event;
}

export function createNewImplementationEvent(
  governanceAddress: Address,
  oldImplementation: Address,
  newImplementation: Address,
): NewImplementation {
  const event = changetype<NewImplementation>(newMockEvent());
  event.address = governanceAddress;
  event.parameters = [];

  const oldImplementationParam = new ethereum.EventParam(
    'oldImplementation',
    ethereum.Value.fromAddress(oldImplementation),
  );
  event.parameters.push(oldImplementationParam);

  const newImplementationParam = new ethereum.EventParam(
    'newImplementation',
    ethereum.Value.fromAddress(newImplementation),
  );
  event.parameters.push(newImplementationParam);

  return event;
}

export function createNewProposalThresholdEvent(
  governanceAddress: Address,
  oldProposalThreshold: BigInt,
  newProposalThreshold: BigInt,
): ProposalThresholdSet {
  const event = changetype<ProposalThresholdSet>(newMockEvent());
  event.address = governanceAddress;
  event.parameters = [];

  const oldProposalThresholdParam = new ethereum.EventParam(
    'oldProposalThreshold',
    ethereum.Value.fromUnsignedBigInt(oldProposalThreshold),
  );
  event.parameters.push(oldProposalThresholdParam);

  const newProposalThresholdParam = new ethereum.EventParam(
    'newProposalThreshold',
    ethereum.Value.fromUnsignedBigInt(newProposalThreshold),
  );
  event.parameters.push(newProposalThresholdParam);

  return event;
}

export function createNewPendingAdminEvent(
  governanceAddress: Address,
  oldPendingAdmin: Address,
  newPendingAdmin: Address,
): NewPendingAdmin {
  const event = changetype<NewPendingAdmin>(newMockEvent());
  event.address = governanceAddress;
  event.parameters = [];

  const oldPendingAdminParam = new ethereum.EventParam(
    'oldPendingAdmin',
    ethereum.Value.fromAddress(oldPendingAdmin),
  );
  event.parameters.push(oldPendingAdminParam);

  const newPendingAdminParam = new ethereum.EventParam(
    'newPendingAdmin',
    ethereum.Value.fromAddress(newPendingAdmin),
  );
  event.parameters.push(newPendingAdminParam);

  return event;
}

export function createNewAdminEvent(
  governanceAddress: Address,
  oldAdmin: Address,
  newAdmin: Address,
): NewAdmin {
  const event = changetype<NewAdmin>(newMockEvent());
  event.address = governanceAddress;
  event.parameters = [];

  const oldAdminParam = new ethereum.EventParam('oldAdmin', ethereum.Value.fromAddress(oldAdmin));
  event.parameters.push(oldAdminParam);

  const newAdminParam = new ethereum.EventParam('newAdmin', ethereum.Value.fromAddress(newAdmin));
  event.parameters.push(newAdminParam);

  return event;
}

export function createNewGuardianEvent(
  governanceAddress: Address,
  oldGuardian: Address,
  newGuardian: Address,
): NewGuardian {
  const event = changetype<NewGuardian>(newMockEvent());
  event.address = governanceAddress;
  event.parameters = [];

  const oldGuardianParam = new ethereum.EventParam(
    'oldGuardian',
    ethereum.Value.fromAddress(oldGuardian),
  );
  event.parameters.push(oldGuardianParam);

  const newGuardianParam = new ethereum.EventParam(
    'newGuardian',
    ethereum.Value.fromAddress(newGuardian),
  );
  event.parameters.push(newGuardianParam);

  return event;
}
