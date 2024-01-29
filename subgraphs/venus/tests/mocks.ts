import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

import { vBnbAddress } from './constants';

export const mockPriceOracleAddress = Address.fromString(
  '0x0000000000000000000000000000000000000001',
);

export const createVBep20AndUnderlyingMock = (
  vTokenContractAddress: Address,
  underlyingAddress: Address,
  name: string,
  symbol: string,
  decimals: BigInt,
  reserveFactorMantissa: BigInt,
  interestRateModelAddress: Address,
): void => {
  // vBep20
  createMockedFunction(vTokenContractAddress, 'underlying', 'underlying():(address)').returns([
    ethereum.Value.fromAddress(underlyingAddress),
  ]);
  createMockedFunction(vTokenContractAddress, 'name', 'name():(string)').returns([
    ethereum.Value.fromString(`Venus ${name}`),
  ]);
  createMockedFunction(vTokenContractAddress, 'symbol', 'symbol():(string)').returns([
    ethereum.Value.fromString(`v${symbol}`),
  ]);
  createMockedFunction(
    vTokenContractAddress,
    'interestRateModel',
    'interestRateModel():(address)',
  ).returns([ethereum.Value.fromAddress(interestRateModelAddress)]);

  createMockedFunction(
    vTokenContractAddress,
    'reserveFactorMantissa',
    'reserveFactorMantissa():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(reserveFactorMantissa)]);

  createMockedFunction(vTokenContractAddress, 'decimals', 'decimals():(uint8)').returns([
    ethereum.Value.fromUnsignedBigInt(decimals),
  ]);

  createMockedFunction(
    vTokenContractAddress,
    'accrualBlockNumber',
    'accrualBlockNumber():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('100'))]);

  createMockedFunction(
    vTokenContractAddress,
    'exchangeRateStored',
    'exchangeRateStored():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

  createMockedFunction(
    vTokenContractAddress,
    'borrowRatePerBlock',
    'borrowRatePerBlock():(uint256)',
  ).returns([ethereum.Value.fromI32(0)]);

  createMockedFunction(
    vTokenContractAddress,
    'supplyRatePerBlock',
    'supplyRatePerBlock():(uint256)',
  ).returns([ethereum.Value.fromI32(0)]);

  createMockedFunction(vTokenContractAddress, 'totalSupply', 'totalSupply():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
  ]);

  createMockedFunction(vTokenContractAddress, 'borrowIndex', 'borrowIndex():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
  ]);

  createMockedFunction(vTokenContractAddress, 'totalReserves', 'totalReserves():(uint256)').returns(
    [ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))],
  );

  createMockedFunction(vTokenContractAddress, 'totalBorrows', 'totalBorrows():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
  ]);

  createMockedFunction(vTokenContractAddress, 'getCash', 'getCash():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
  ]);

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

  createMockedFunction(comptrollerAddress, 'oracle', 'oracle():(address)').returns([
    ethereum.Value.fromAddress(mockPriceOracleAddress),
  ]);

  createMockedFunction(
    mockPriceOracleAddress,
    'getUnderlyingPrice',
    'getUnderlyingPrice(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(vBnbAddress)])
    .returns([ethereum.Value.fromI32(200000)]);
};
