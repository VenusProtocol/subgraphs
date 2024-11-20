import { BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

import { governorBravoDelegatorAddress } from '../../src/constants/addresses';
import { mockAdminAddress, mockGuardianAddress, mockImplementationAddress, timelockAddress0, timelockAddress1, timelockAddress2 } from './constants';

export const createMockBlock = (): ethereum.Block => {
  return new ethereum.Block(
    Bytes.fromHexString('0x'),
    Bytes.fromHexString('0x'),
    Bytes.fromHexString('0x'),
    mockAdminAddress,
    Bytes.fromHexString('0x'),
    Bytes.fromHexString('0x'),
    Bytes.fromHexString('0x'),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    BigInt.fromI32(0),
    null,
    null,
  );
};

export const createGovernorBravoMocks = (): void => {
  createMockedFunction(governorBravoDelegatorAddress, 'implementation', 'implementation():(address)').returns([ethereum.Value.fromAddress(mockImplementationAddress)]);

  createMockedFunction(governorBravoDelegatorAddress, 'admin', 'admin():(address)').returns([ethereum.Value.fromAddress(mockAdminAddress)]);

  createMockedFunction(governorBravoDelegatorAddress, 'guardian', 'guardian():(address)').returns([ethereum.Value.fromAddress(mockGuardianAddress)]);

  createMockedFunction(governorBravoDelegatorAddress, 'quorumVotes', 'quorumVotes():(uint256)').returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

  createMockedFunction(governorBravoDelegatorAddress, 'proposalMaxOperations', 'proposalMaxOperations():(uint256)').returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

  // Proposal Configs
  createMockedFunction(governorBravoDelegatorAddress, 'proposalConfigs', 'proposalConfigs(uint256):(uint256,uint256,uint256)')
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('28800')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300000000000000000000000')),
    ]);
  createMockedFunction(governorBravoDelegatorAddress, 'proposalConfigs', 'proposalConfigs(uint256):(uint256,uint256,uint256)')
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1'))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('28800')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300000000000000000000000')),
    ]);
  createMockedFunction(governorBravoDelegatorAddress, 'proposalConfigs', 'proposalConfigs(uint256):(uint256,uint256,uint256)')
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('2'))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('7200')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300000000000000000000000')),
    ]);

  createMockedFunction(governorBravoDelegatorAddress, 'proposalTimelocks', 'proposalTimelocks(uint256):(address)')
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))])
    .returns([ethereum.Value.fromAddress(timelockAddress0)]);
  createMockedFunction(governorBravoDelegatorAddress, 'proposalTimelocks', 'proposalTimelocks(uint256):(address)')
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1'))])
    .returns([ethereum.Value.fromAddress(timelockAddress1)]);
  createMockedFunction(governorBravoDelegatorAddress, 'proposalTimelocks', 'proposalTimelocks(uint256):(address)')
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('2'))])
    .returns([ethereum.Value.fromAddress(timelockAddress2)]);

  // Timelocks
  createMockedFunction(timelockAddress0, 'delay', 'delay():(uint256)').returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('172800'))]);
  createMockedFunction(timelockAddress1, 'delay', 'delay():(uint256)').returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('21600'))]);
  createMockedFunction(timelockAddress2, 'delay', 'delay():(uint256)').returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('3600'))]);
};
