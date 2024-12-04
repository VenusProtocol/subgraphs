import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

import { comptrollerAddress, vBnbAddress, priceOracleAddress } from './constants';

export const createMockBlock = (): ethereum.Block => {
  return new ethereum.Block(
    Bytes.fromHexString('0x'),
    Bytes.fromHexString('0x'),
    Bytes.fromHexString('0x'),
    comptrollerAddress,
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

export const createVBep20AndUnderlyingMock = (
  contractAddress: Address,
  underlyingAddress: Address,
  name: string,
  symbol: string,
  decimals: BigInt,
  reserveFactorMantissa: BigInt,
  interestRateModelAddress: Address,
  underlyingPrice: BigInt,
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

  createMockedFunction(contractAddress, 'comptroller', 'comptroller():(address)').returns([
    ethereum.Value.fromAddress(comptrollerAddress),
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

  createMockedFunction(
    priceOracleAddress,
    'getUnderlyingPrice',
    'getUnderlyingPrice(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(contractAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(underlyingPrice)]);

  createMockedFunction(
    contractAddress,
    'borrowRatePerBlock',
    'borrowRatePerBlock():(uint256)',
  ).returns([ethereum.Value.fromI32(12678493)]);

  createMockedFunction(contractAddress, 'getCash', 'getCash():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1418171344423412457')),
  ]);

  createMockedFunction(
    contractAddress,
    'exchangeRateStored',
    'exchangeRateStored():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('365045823500000000000000'))]);

  createMockedFunction(contractAddress, 'badDebt', 'badDebt():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
  ]);

  createMockedFunction(contractAddress, 'totalSupply', 'totalSupply():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('36504567163409')),
  ]);

  createMockedFunction(contractAddress, 'totalBorrows', 'totalBorrows():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('36504567163409')),
  ]);

  createMockedFunction(contractAddress, 'totalReserves', 'totalReserves():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('5128000000000000000')),
  ]);

  createMockedFunction(
    contractAddress,
    'accrualBlockNumber',
    'accrualBlockNumber():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('999'))]);

  createMockedFunction(contractAddress, 'borrowIndex', 'borrowIndex():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
  ]);

  createMockedFunction(
    contractAddress,
    'supplyRatePerBlock',
    'supplyRatePerBlock():(uint256)',
  ).returns([ethereum.Value.fromI32(12678493)]);

  createMockedFunction(contractAddress, 'decimals', 'decimals():(uint8)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('18')),
  ]);
};

export const createPriceOracleMock = (tokens: Array<Array<ethereum.Value>>): void => {
  tokens.forEach((token): void => {
    createMockedFunction(
      priceOracleAddress,
      'getUnderlyingPrice',
      'getUnderlyingPrice(address):(uint256)',
    )
      .withArgs([token[0]])
      .returns([token[1]]);
  });
};

export const createAccountVTokenBalanceOfMock = (
  vTokenAddress: Address,
  accountAddress: Address,
  balance: BigInt,
): void => {
  createMockedFunction(vTokenAddress, 'comptroller', 'comptroller():(address)').returns([
    ethereum.Value.fromAddress(comptrollerAddress),
  ]);

  createMockedFunction(vTokenAddress, 'borrowIndex', 'borrowIndex():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('50000000')),
  ]);

  createMockedFunction(vTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromSignedBigInt(balance)]);
};

export const createBorrowBalanceCurrentMock = (
  vTokenAddress: Address,
  accountAddress: Address,
  balance: BigInt,
): void => {
  createMockedFunction(
    vTokenAddress,
    'borrowBalanceStored',
    'borrowBalanceStored(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromSignedBigInt(balance)]);
};

export const createComptrollerMock = (vTokens: Address[]): void => {
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
    ethereum.Value.fromAddress(priceOracleAddress),
  ]);

  createMockedFunction(
    priceOracleAddress,
    'getUnderlyingPrice',
    'getUnderlyingPrice(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(vBnbAddress)])
    .returns([ethereum.Value.fromI32(200000)]);

  createMockedFunction(
    comptrollerAddress,
    'closeFactorMantissa',
    'closeFactorMantissa():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('10000000000000000'))]);

  createMockedFunction(
    comptrollerAddress,
    'liquidationIncentiveMantissa',
    'liquidationIncentiveMantissa():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1000000000000000'))]);

  createMockedFunction(comptrollerAddress, 'maxAssets', 'maxAssets():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('999')),
  ]);

  vTokens.forEach(vToken => {
    createMockedFunction(comptrollerAddress, 'supplyCaps', 'supplyCaps(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(vToken)])
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

    createMockedFunction(comptrollerAddress, 'borrowCaps', 'borrowCaps(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(vToken)])
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

    createMockedFunction(comptrollerAddress, 'markets', 'markets(address):(bool,uint256,uint256)')
      .withArgs([ethereum.Value.fromAddress(vToken)])
      .returns([
        ethereum.Value.fromBoolean(true),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
      ]);

    createMockedFunction(
      comptrollerAddress,
      'venusBorrowState',
      'venusBorrowState(address):(uint224,uint32)',
    )
      .withArgs([ethereum.Value.fromAddress(vToken)])
      .returns([ethereum.Value.fromI32(999), ethereum.Value.fromI32(999)]);

    createMockedFunction(
      comptrollerAddress,
      'venusSupplyState',
      'venusSupplyState(address):(uint224,uint32)',
    )
      .withArgs([ethereum.Value.fromAddress(vToken)])
      .returns([ethereum.Value.fromI32(999)]);

    createMockedFunction(
      comptrollerAddress,
      'venusSupplySpeeds',
      'venusSupplySpeeds(address):(uint256)',
    )
      .withArgs([ethereum.Value.fromAddress(vToken)])
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('999'))]);

    createMockedFunction(
      comptrollerAddress,
      'venusBorrowSpeeds',
      'venusBorrowSpeeds(address):(uint256)',
    )
      .withArgs([ethereum.Value.fromAddress(vToken)])
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1000'))]);
  });
};
