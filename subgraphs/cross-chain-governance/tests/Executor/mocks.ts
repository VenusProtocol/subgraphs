import { Address, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

export const MOCK_GUARDIAN = Address.fromString('0xc3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3');

export const createGovernanceMock = (): void => {
  createMockedFunction(
    Address.fromString('0xd9fEc8238711935D6c8d79Bef2B9546ef23FC046'),
    'guardian',
    'guardian():(address)',
  ).returns([ethereum.Value.fromAddress(MOCK_GUARDIAN)]);

  createMockedFunction(
    Address.fromString('0xd9fEc8238711935D6c8d79Bef2B9546ef23FC046'),
    'srcChainId',
    'srcChainId():(uint16)',
  ).returns([ethereum.Value.fromI32(2)]);
};
