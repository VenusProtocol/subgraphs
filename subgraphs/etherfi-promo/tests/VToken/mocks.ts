import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

export const mockPriceOracleAddress = Address.fromString(
  '0xb0b0000000000000000000000000000000000000',
);

export const createVBep20Mock = (contractAddress: Address, exchangeRateCurrent: BigInt): void => {
  createMockedFunction(
    contractAddress,
    'exchangeRateCurrent',
    'exchangeRateCurrent():(uint256)',
  ).returns([ethereum.Value.fromUnsignedBigInt(exchangeRateCurrent)]);
};

export const createAccountVTokenBalanceOfMock = (
  vTokenAddress: Address,
  accountAddress: Address,
  balance: BigInt,
  borrowBalanceStored: BigInt,
): void => {
  createMockedFunction(vTokenAddress, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromSignedBigInt(balance)]);

  createMockedFunction(
    vTokenAddress,
    'borrowBalanceStored',
    'borrowBalanceStored(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(accountAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(borrowBalanceStored)]);
};
