import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

export const createRewardsDistributorMock = (
  rewardsDistributorAddress: Address,
  rewardTokenAddress: Address,
): void => {
  createMockedFunction(rewardsDistributorAddress, 'rewardToken', 'rewardToken():(address)').returns(
    [ethereum.Value.fromAddress(rewardTokenAddress)],
  );

  createMockedFunction(
    rewardsDistributorAddress,
    'rewardTokenBorrowSpeeds',
    'rewardTokenBorrowSpeeds(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(rewardTokenAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('40000000000'))]);

  createMockedFunction(
    rewardsDistributorAddress,
    'rewardTokenSupplySpeeds',
    'rewardTokenSupplySpeeds(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(rewardTokenAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('30000000000'))]);
};
