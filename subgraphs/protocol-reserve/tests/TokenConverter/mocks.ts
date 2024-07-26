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

export const createTokenMock = (address: Address, symbol: string): void => {
  createMockedFunction(address, 'symbol', 'symbol():(string)').returns([
    ethereum.Value.fromString(symbol),
  ]);

  createMockedFunction(address, 'decimals', 'decimals():(uint8)').returns([
    ethereum.Value.fromI32(18),
  ]);
};
