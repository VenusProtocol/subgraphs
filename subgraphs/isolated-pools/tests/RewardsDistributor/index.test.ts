import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';
import {
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { RewardsDistributor } from '../../generated/schema';
import { handleNewRewardsDistributor } from '../../src/mappings/pool';
import {
  handleRewardTokenBorrowSpeedUpdated,
  handleRewardTokenSupplySpeedUpdated,
} from '../../src/mappings/rewardsDistributor';
import { getRewardSpeedId } from '../../src/utilities/ids';
import { createNewRewardsDistributor } from '../Pool/events';
import { createMarketMock } from '../VToken/mocks';
import {
  createRewardTokenBorrowSpeedUpdatedEvent,
  createRewardTokenSupplySpeedUpdatedEvent,
} from './events';
import { createRewardsDistributorMock } from './mocks';

const vTokenAddress = Address.fromString('0x0000000000000000000000000000000000000a0a');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
const rewardsDistributorAddress = Address.fromString('0x082F27894f3E3CbC2790899AEe82D6f149521AFa');
const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createMockedFunction(comptrollerAddress, 'getAllMarkets', 'getAllMarkets():(address[])').returns([
    ethereum.Value.fromArray([]),
  ]);
});

beforeEach(() => {
  createRewardsDistributorMock(rewardsDistributorAddress, tokenAddress);
  const newRewardsDistributorEvent = createNewRewardsDistributor(
    comptrollerAddress,
    rewardsDistributorAddress,
  );

  handleNewRewardsDistributor(newRewardsDistributorEvent);
  createMarketMock(vTokenAddress);
});

afterEach(() => {
  cleanup();
});

describe('Rewards Distributor', () => {
  test('indexes new borrow speed', () => {
    const newBorrowRate = '6000000000';
    const rewardTokenBorrowSpeedUpdatedEvent = createRewardTokenBorrowSpeedUpdatedEvent(
      rewardsDistributorAddress,
      vTokenAddress,
      BigInt.fromString(newBorrowRate),
    );

    handleRewardTokenBorrowSpeedUpdated(rewardTokenBorrowSpeedUpdatedEvent);

    const rewardId = getRewardSpeedId(rewardsDistributorAddress, vTokenAddress).toHexString();
    assert.fieldEquals('RewardSpeed', rewardId, 'id', rewardId);
    assert.fieldEquals('RewardSpeed', rewardId, 'market', vTokenAddress.toHexString());
    assert.fieldEquals(
      'RewardSpeed',
      rewardId,
      'rewardsDistributor',
      rewardsDistributorAddress.toHexString(),
    );
    assert.fieldEquals('RewardSpeed', rewardId, 'supplySpeedPerBlockMantissa', '0');
    assert.fieldEquals('RewardSpeed', rewardId, 'borrowSpeedPerBlockMantissa', newBorrowRate);

    const rewardsDistributor = RewardsDistributor.load(rewardsDistributorAddress)!;
    const rewardSpeeds = rewardsDistributor.rewardSpeeds.load();
    assert.stringEquals(rewardId, rewardSpeeds[0].id.toHexString());
  });

  test('indexes new supply speed', () => {
    const newSupplyRate = '7000000000';
    const rewardTokenSupplySpeedUpdatedEvent = createRewardTokenSupplySpeedUpdatedEvent(
      rewardsDistributorAddress,
      vTokenAddress,
      BigInt.fromString(newSupplyRate),
    );

    handleRewardTokenSupplySpeedUpdated(rewardTokenSupplySpeedUpdatedEvent);
    const rewardId = getRewardSpeedId(rewardsDistributorAddress, vTokenAddress).toHexString();

    assert.fieldEquals('RewardSpeed', rewardId, 'id', rewardId);
    assert.fieldEquals('RewardSpeed', rewardId, 'market', vTokenAddress.toHexString());
    assert.fieldEquals(
      'RewardSpeed',
      rewardId,
      'rewardsDistributor',
      rewardsDistributorAddress.toHexString(),
    );
    assert.fieldEquals('RewardSpeed', rewardId, 'supplySpeedPerBlockMantissa', newSupplyRate);
    assert.fieldEquals('RewardSpeed', rewardId, 'borrowSpeedPerBlockMantissa', '0');

    const rewardsDistributor = RewardsDistributor.load(rewardsDistributorAddress)!;
    const rewardSpeeds = rewardsDistributor.rewardSpeeds.load();
    assert.stringEquals(rewardId, rewardSpeeds[0].id.toHexString());
  });
});
