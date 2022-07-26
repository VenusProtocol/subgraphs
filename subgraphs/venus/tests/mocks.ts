import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

export const createVBep20AndUnderlyingMock = (
  contractAddress: Address,
  underlyingAddress: Address,
  name: string,
  symbol: string,
  decimals: BigInt,
  reserveFactorMantissa: BigInt,
  interestRateModelAddress: Address,
): void => {
  // vBep20
  createMockedFunction(contractAddress, 'underlying', 'underlying():(address)').returns([
    ethereum.Value.fromAddress(underlyingAddress),
  ]);
  createMockedFunction(contractAddress, 'name', 'name():(string)').returns([
    ethereum.Value.fromString(`Venus ${name}`),
  ]);
  createMockedFunction(contractAddress, 'symbol', 'symbol():(string)').returns([
    ethereum.Value.fromString(`v${symbol}`),
  ]);
  createMockedFunction(
    contractAddress,
    'interestRateModel',
    'interestRateModel():(address)',
  ).returns([ethereum.Value.fromAddress(interestRateModelAddress)]);
  createMockedFunction(
    contractAddress,
    'reserveFactorMantissa',
    'reserveFactorMantissa():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(reserveFactorMantissa)]);

  // Underlying
  createMockedFunction(underlyingAddress, 'decimals', 'decimals():(uint8)').returns([
    ethereum.Value.fromUnsignedBigInt(decimals),
  ]);
  createMockedFunction(underlyingAddress, 'name', 'name():(string)').returns([
    ethereum.Value.fromString(name),
  ]);
  createMockedFunction(underlyingAddress, 'symbol', 'symbol():(string)').returns([
    ethereum.Value.fromString(symbol),
  ]);
};
