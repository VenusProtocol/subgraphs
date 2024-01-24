import { Address, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

export const createTokenConverterMock = (
  tokenConverterAddress: Address,
  destinationAddress: Address,
  baseAssetAddress: Address,
): void => {
  createMockedFunction(
    tokenConverterAddress,
    'destinationAddress',
    'destinationAddress():(address)',
  ).returns([ethereum.Value.fromAddress(destinationAddress)]);

  createMockedFunction(tokenConverterAddress, 'baseAsset', 'baseAsset():(address)').returns([
    ethereum.Value.fromAddress(baseAssetAddress),
  ]);
};
