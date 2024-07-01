import { Address, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

import { omnichainExecutorOwnerAddress } from '../../src/constants/addresses';

export const MOCK_GUARDIAN = Address.fromString('0xc3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3');

export const createGovernanceMock = (): void => {
  createMockedFunction(omnichainExecutorOwnerAddress, 'guardian', 'guardian():(address)').returns([
    ethereum.Value.fromAddress(MOCK_GUARDIAN),
  ]);

  createMockedFunction(
    omnichainExecutorOwnerAddress,
    'srcChainId',
    'srcChainId():(uint16)',
  ).returns([ethereum.Value.fromI32(2)]);
};
