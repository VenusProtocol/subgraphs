import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

export const mockPriceOracleAddress = Address.fromString(
  '0xb0b0000000000000000000000000000000000000',
);

export const createVBep20Mock = (
  contractAddress: Address,
  underlyingAddress: Address,
  exchangeRateCurrent: BigInt,
): void => {
  createMockedFunction(
    contractAddress,
    'exchangeRateCurrent',
    'exchangeRateCurrent():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(exchangeRateCurrent)]);

  createMockedFunction(contractAddress, 'underlying', 'underlying():(address)').returns([
    ethereum.Value.fromAddress(underlyingAddress),
  ]);

  createMockedFunction(underlyingAddress, 'decimals', 'decimals():(uint8)').returns([
    ethereum.Value.fromI32(18),
  ]);
};

export const createBep20Mock = (
  contractAddress: Address,
  accountAddress: Address,
  balanceOf: BigInt,
): void => {
  createMockedFunction(contractAddress, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(balanceOf)]);

  createMockedFunction(contractAddress, 'decimals', 'decimals():(uint8)').returns([
    ethereum.Value.fromI32(18),
  ]);
};

export const createMarketPositionBalanceOfMock = (
  vTokenAddress: Address,
  underlyingAddress: Address,
  accountAddress: Address,
  balance: BigInt,
  borrowBalanceCurrent: BigInt,
  totalBorrows: BigInt,
  totalReserves: BigInt,
): void => {
  createMockedFunction(vTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromSignedBigInt(balance)]);

  createMockedFunction(
    vTokenAddress,
    'totalBorrowsCurrent',
    'totalBorrowsCurrent():(uint256)',
  ).returns([ethereum.Value.fromSignedBigInt(totalBorrows)]);

  createMockedFunction(vTokenAddress, 'totalReserves', 'totalReserves():(uint256)').returns([
    ethereum.Value.fromSignedBigInt(totalReserves),
  ]);

  createMockedFunction(vTokenAddress, 'underlying', 'underlying():(address)').returns([
    ethereum.Value.fromAddress(underlyingAddress),
  ]);

  createMockedFunction(
    vTokenAddress,
    'borrowBalanceCurrent',
    'borrowBalanceCurrent(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(borrowBalanceCurrent)]);
};
