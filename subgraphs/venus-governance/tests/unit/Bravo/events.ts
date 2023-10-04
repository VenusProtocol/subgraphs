import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  NewAdmin,
  NewGuardian,
  NewImplementation,
  NewPendingAdmin,
  ProposalMaxOperationsUpdated,
} from '../../../generated/GovernorBravoDelegate/GovernorBravoDelegate';

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

export function createNewProposalMaxOperationsEvent(
  governanceAddress: Address,
  oldMaxOperations: BigInt,
  newMaxOperations: BigInt,
): ProposalMaxOperationsUpdated {
  const event = changetype<ProposalMaxOperationsUpdated>(newMockEvent());
  event.address = governanceAddress;
  event.parameters = [];

  const oldMaxOperationsParam = new ethereum.EventParam(
    'oldMaxOperations',
    ethereum.Value.fromUnsignedBigInt(oldMaxOperations),
  );
  event.parameters.push(oldMaxOperationsParam);

  const newMaxOperationsParam = new ethereum.EventParam(
    'newMaxOperations',
    ethereum.Value.fromUnsignedBigInt(newMaxOperations),
  );
  event.parameters.push(newMaxOperationsParam);

  return event;
}
