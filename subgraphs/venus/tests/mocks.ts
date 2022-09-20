import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

import { vBnbAddress, vUsdcAddress } from '../src/constants/addresses';

export const mockPriceOracleAddress = Address.fromString(
  '0x0000000000000000000000000000000000000001',
);

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

export const createComptrollerMock = (comptrollerAddress: Address): void => {
  createMockedFunction(comptrollerAddress, 'oracle', 'oracle():(address)').returns([
    ethereum.Value.fromAddress(mockPriceOracleAddress),
  ]);

  createMockedFunction(
    comptrollerAddress,
    'closeFactorMantissa',
    'closeFactorMantissa():(uint256)',
  ).returns([ethereum.Value.fromI32(1)]);

  createMockedFunction(
    comptrollerAddress,
    'liquidationIncentiveMantissa',
    'liquidationIncentiveMantissa():(uint256)',
  ).returns([ethereum.Value.fromI32(1)]);

  createMockedFunction(comptrollerAddress, 'maxAssets', 'maxAssets():(uint256)').returns([
    ethereum.Value.fromI32(10),
  ]);

  createMockedFunction(
    mockPriceOracleAddress,
    'getUnderlyingPrice',
    'getUnderlyingPrice(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(vUsdcAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1000000000000000'))]);

  createMockedFunction(
    mockPriceOracleAddress,
    'getUnderlyingPrice',
    'getUnderlyingPrice(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(vBnbAddress)])
    .returns([ethereum.Value.fromI32(200000)]);
};
