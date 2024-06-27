import { Address, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

import { omnichainProposalSenderAddress } from '../../../src/constants/addresses';

export const MOCK_ACCESS_CONTROL_MANAGER = Address.fromString(
  '0xc3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3',
);

export const createOmnichainProposalSenderMock = (): void => {
  createMockedFunction(
    omnichainProposalSenderAddress,
    'accessControlManager',
    'accessControlManager():(address)',
  ).returns([ethereum.Value.fromAddress(MOCK_ACCESS_CONTROL_MANAGER)]);
};
