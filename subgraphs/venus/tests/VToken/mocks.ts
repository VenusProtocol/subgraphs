import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

export const mockPriceOracleAddress = Address.fromString(
  '0xb0b0000000000000000000000000000000000000',
);

export const createVBep20AndUnderlyingMock = (
  contractAddress: Address,
  underlyingAddress: Address,
  comptrollerAddress: Address,
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
    mockPriceOracleAddress,
    'getUnderlyingPrice',
    'getUnderlyingPrice(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(contractAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(underlyingPrice)]);

  createMockedFunction(
    contractAddress,
    'borrowRatePerBlock',
    'borrowRatePerBlock():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

  createMockedFunction(contractAddress, 'getCash', 'getCash():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
  ]);

  createMockedFunction(
    contractAddress,
    'exchangeRateStored',
    'exchangeRateStored():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

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
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
  ]);

  createMockedFunction(
    contractAddress,
    'accrualBlockNumber',
    'accrualBlockNumber():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

  createMockedFunction(contractAddress, 'borrowIndex', 'borrowIndex():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
  ]);

  createMockedFunction(
    contractAddress,
    'supplyRatePerBlock',
    'supplyRatePerBlock():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

  createMockedFunction(contractAddress, 'decimals', 'decimals():(uint8)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('18')),
  ]);

  createMockedFunction(comptrollerAddress, 'supplyCaps', 'supplyCaps(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(contractAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

  createMockedFunction(comptrollerAddress, 'borrowCaps', 'borrowCaps(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(contractAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0'))]);

  createMockedFunction(comptrollerAddress, 'markets', 'markets(address):(bool,uint256,uint256)')
    .withArgs([ethereum.Value.fromAddress(contractAddress)])
    .returns([
      ethereum.Value.fromBoolean(true),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString('0')),
    ]);
  createMockedFunction(comptrollerAddress, 'oracle', 'oracle():(address)').returns([
    ethereum.Value.fromAddress(mockPriceOracleAddress),
  ]);

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
};

export const createMarketMock = (marketAddress: Address): void => {
  createMockedFunction(
    marketAddress,
    'accrualBlockNumber',
    'accrualBlockNumber():(uint256)',
  ).returns([ethereum.Value.fromI32(999)]);

  createMockedFunction(marketAddress, 'totalSupply', 'totalSupply():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('36504567163409')),
  ]);

  createMockedFunction(
    marketAddress,
    'exchangeRateStored',
    'exchangeRateStored():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('365045823500000000000000'))]);

  createMockedFunction(marketAddress, 'borrowIndex', 'borrowIndex():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300000000000000000000')),
  ]);

  createMockedFunction(marketAddress, 'totalReserves', 'totalReserves():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('5128924555022289393')),
  ]);

  createMockedFunction(marketAddress, 'totalBorrows', 'totalBorrows():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('2641234234636158123')),
  ]);

  createMockedFunction(marketAddress, 'getCash', 'getCash():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1418171344423412457')),
  ]);

  createMockedFunction(
    marketAddress,
    'borrowRatePerBlock',
    'borrowRatePerBlock():(uint256)',
  ).returns([ethereum.Value.fromI32(12678493)]);

  createMockedFunction(
    marketAddress,
    'supplyRatePerBlock',
    'supplyRatePerBlock():(uint256)',
  ).returns([ethereum.Value.fromI32(12678493)]);
};

// type Tokens = [address, price][]
export const createPriceOracleMock = (tokens: Array<Array<ethereum.Value>>): void => {
  tokens.forEach((token): void => {
    createMockedFunction(
      mockPriceOracleAddress,
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
  createMockedFunction(vTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromSignedBigInt(balance)]);
};
