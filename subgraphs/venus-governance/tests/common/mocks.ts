import { BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

import { governorBravoDelegateAddress } from '../../src/constants/addresses';
import {
  mockAdminAddress,
  mockGuardianAddress,
  mockImplementationAddress,
  timelockAddress0,
  timelockAddress1,
  timelockAddress2,
} from './constants';

export const createGovernorBravoMocks = (): void => {
  createMockedFunction(
    governorBravoDelegateAddress,
    'implementation',
    'implementation():(address)',
  ).returns([ethereum.Value.fromAddress(mockImplementationAddress)]);

  createMockedFunction(governorBravoDelegateAddress, 'admin', 'admin():(address)').returns([
    ethereum.Value.fromAddress(mockAdminAddress),
  ]);

  createMockedFunction(governorBravoDelegateAddress, 'guardian', 'guardian():(address)').returns([
    ethereum.Value.fromAddress(mockGuardianAddress),
  ]);

  createMockedFunction(
    governorBravoDelegateAddress,
    'quorumVotes',
    'quorumVotes():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

  createMockedFunction(
    governorBravoDelegateAddress,
    'proposalMaxOperations',
    'proposalMaxOperations():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

  // Proposal Configs
  createMockedFunction(
    governorBravoDelegateAddress,
    'proposalConfigs',
    'proposalConfigs(uint256):(uint256,uint256,uint256)',
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('28800')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300000000000000000000000')),
    ]);
  createMockedFunction(
    governorBravoDelegateAddress,
    'proposalConfigs',
    'proposalConfigs(uint256):(uint256,uint256,uint256)',
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1'))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('28800')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300000000000000000000000')),
    ]);
  createMockedFunction(
    governorBravoDelegateAddress,
    'proposalConfigs',
    'proposalConfigs(uint256):(uint256,uint256,uint256)',
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('2'))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('7200')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300000000000000000000000')),
    ]);

  createMockedFunction(
    governorBravoDelegateAddress,
    'proposalTimelocks',
    'proposalTimelocks(uint256):(address)',
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))])
    .returns([ethereum.Value.fromAddress(timelockAddress0)]);
  createMockedFunction(
    governorBravoDelegateAddress,
    'proposalTimelocks',
    'proposalTimelocks(uint256):(address)',
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1'))])
    .returns([ethereum.Value.fromAddress(timelockAddress1)]);
  createMockedFunction(
    governorBravoDelegateAddress,
    'proposalTimelocks',
    'proposalTimelocks(uint256):(address)',
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('2'))])
    .returns([ethereum.Value.fromAddress(timelockAddress2)]);

  // Timelocks
  createMockedFunction(timelockAddress0, 'delay', 'delay():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('172800')),
  ]);
  createMockedFunction(timelockAddress1, 'delay', 'delay():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('21600')),
  ]);
  createMockedFunction(timelockAddress2, 'delay', 'delay():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('3600')),
  ]);
};
