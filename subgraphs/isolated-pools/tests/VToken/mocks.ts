import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

import {
  poolLensAddress,
  poolRegistryAddress,
  priceOracleAddress,
} from '../../src/constants/addresses';

// type PoolsArray = [name: string, creator: Address, comptroller: Address, blockPosted: BigInt, timestampPosted: BigInt][];
export const createPoolRegistryMock = (pools: Array<Array<ethereum.Value>>): void => {
  pools.forEach((pool, idx): void => {
    const tupleArray: Array<ethereum.Value> = [
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(idx)), // id
      pool[0], // name
      pool[1], // creator
      pool[2], // comptroller
      pool[3], // blockPosted
      pool[4], // timestampPosted
    ];
    const tuple = changetype<ethereum.Tuple>(tupleArray);
    const tupleValue = ethereum.Value.fromTuple(tuple);

    createMockedFunction(
      poolRegistryAddress,
      'getPoolByID',
      'getPoolByID(uint256):((uint256,string,address,address,uint256,uint256))',
    )
      .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(idx))])
      .returns([tupleValue]);

    // address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool,uint256,address,uint256,uint256
    const vTokenData = changetype<ethereum.Tuple>([
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000000')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
      ethereum.Value.fromBoolean(true),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000000')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(0)),
    ]);

    const lensTupleArray: Array<ethereum.Value> = [
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(idx)), // poolId
      pool[0], // name
      pool[1], // creator
      pool[2], // comptroller
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(100)), // blockPosted
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(1662990421)), // timestampPosted
      ethereum.Value.fromI32(1), // riskRating
      ethereum.Value.fromString('Games'), // category
      ethereum.Value.fromString('/logo.png'), // logoURL
      ethereum.Value.fromString('Game related tokens'), // description
      ethereum.Value.fromAddress(priceOracleAddress), // priceOracle
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(5)), // closeFactor
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(7)), // liquidationIncentive
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(10)), // maxAssets
      ethereum.Value.fromArray([ethereum.Value.fromTuple(vTokenData)]), // vTokens
    ];
    const lensTuple = changetype<ethereum.Tuple>(lensTupleArray);
    const lensTupleValue = ethereum.Value.fromTuple(lensTuple);

    createMockedFunction(
      poolLensAddress,
      'getPoolByComptroller',
      'getPoolByComptroller(address,address):((uint256,string,address,address,uint256,uint256,uint8,string,string,string,address,uint256,uint256,uint256,(address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool,uint256,address,uint256,uint256)[]))',
    )
      .withArgs([ethereum.Value.fromAddress(poolRegistryAddress), pool[2]])
      .returns([lensTupleValue]);
  });
};

export const createVBep20AndUnderlyingMock = (
  contractAddress: Address,
  underlyingAddress: Address,
  comptrollerAddress: Address,
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
};

export const createMarketMock = (marketAddress: Address): void => {
  createMockedFunction(
    marketAddress,
    'accrualBlockNumber',
    'accrualBlockNumber():(uint256)',
  ).returns([ethereum.Value.fromI32(999)]);

  createMockedFunction(marketAddress, 'totalSupply', 'totalSupply():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(36504567163409)),
  ]);

  createMockedFunction(
    marketAddress,
    'exchangeRateStored',
    'exchangeRateStored():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(365045823500000000000000))]);

  createMockedFunction(marketAddress, 'borrowIndex', 'borrowIndex():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(300000000000000000000)),
  ]);

  createMockedFunction(marketAddress, 'totalReserves', 'totalReserves():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(5128924555022289393)),
  ]);

  createMockedFunction(marketAddress, 'totalBorrows', 'totalBorrows():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(2641234234636158123)),
  ]);

  createMockedFunction(marketAddress, 'getCash', 'getCash():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI64(1418171344423412457)),
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
      priceOracleAddress,
      'getUnderlyingPrice',
      'getUnderlyingPrice(address):(uint256)',
    )
      .withArgs([token[0]])
      .returns([token[1]]);
  });
};
