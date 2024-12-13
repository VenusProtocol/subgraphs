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
import { getMarketRewardId } from '../../src/utilities/ids';
import { createNewRewardsDistributor } from '../Pool/events';
import { createVBep20AndUnderlyingMock, createBep20Mock } from '../VToken/mocks';
import {
  createRewardTokenBorrowSpeedUpdatedEvent,
  createRewardTokenSupplySpeedUpdatedEvent,
} from './events';
import { createRewardsDistributorMock } from './mocks';

const vTokenAddress = Address.fromString('0x0000000000000000000000000000000000000a0a');
const underlyingAddress = Address.fromString('0x0000000000000000000000000000000000000111');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
const rewardsDistributorAddress = Address.fromString('0x082F27894f3E3CbC2790899AEe82D6f149521AFa');
const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');
const accessControlManagerAddress = Address.fromString(
  '0x45f8a08F534f34A97187626E05d4b6648Eeaa9AA',
);
const underlyingPrice = BigInt.fromString('15000000000000000');

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
  createBep20Mock(tokenAddress, 'B0B Coin', 'B0B', BigInt.fromI32(18));
  const newRewardsDistributorEvent = createNewRewardsDistributor(
    comptrollerAddress,
    rewardsDistributorAddress,
  );

  handleNewRewardsDistributor(newRewardsDistributorEvent);
  createVBep20AndUnderlyingMock(
    vTokenAddress,
    underlyingAddress,
    comptrollerAddress,
    'AAA Coin',
    'AAA',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
    accessControlManagerAddress,
    underlyingPrice,
  );
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

    const rewardId = getMarketRewardId(rewardsDistributorAddress, vTokenAddress).toHexString();
    assert.fieldEquals('MarketReward', rewardId, 'id', rewardId);
    assert.fieldEquals('MarketReward', rewardId, 'market', vTokenAddress.toHexString());
    assert.fieldEquals(
      'MarketReward',
      rewardId,
      'rewardsDistributor',
      rewardsDistributorAddress.toHexString(),
    );
    assert.fieldEquals('MarketReward', rewardId, 'supplySpeedPerBlockMantissa', '0');
    assert.fieldEquals('MarketReward', rewardId, 'borrowSpeedPerBlockMantissa', newBorrowRate);

    const rewardsDistributor = RewardsDistributor.load(rewardsDistributorAddress)!;
    const marketRewards = rewardsDistributor.marketRewards.load();
    assert.stringEquals(rewardId, marketRewards[0].id.toHexString());
  });

  test('indexes new supply speed', () => {
    const newSupplyRate = '7000000000';
    const rewardTokenSupplySpeedUpdatedEvent = createRewardTokenSupplySpeedUpdatedEvent(
      rewardsDistributorAddress,
      vTokenAddress,
      BigInt.fromString(newSupplyRate),
    );

    handleRewardTokenSupplySpeedUpdated(rewardTokenSupplySpeedUpdatedEvent);
    const rewardId = getMarketRewardId(rewardsDistributorAddress, vTokenAddress).toHexString();

    assert.fieldEquals('MarketReward', rewardId, 'id', rewardId);
    assert.fieldEquals('MarketReward', rewardId, 'market', vTokenAddress.toHexString());
    assert.fieldEquals(
      'MarketReward',
      rewardId,
      'rewardsDistributor',
      rewardsDistributorAddress.toHexString(),
    );
    assert.fieldEquals('MarketReward', rewardId, 'supplySpeedPerBlockMantissa', newSupplyRate);
    assert.fieldEquals('MarketReward', rewardId, 'borrowSpeedPerBlockMantissa', '0');

    const rewardsDistributor = RewardsDistributor.load(rewardsDistributorAddress)!;
    const marketRewards = rewardsDistributor.marketRewards.load();
    assert.stringEquals(rewardId, marketRewards[0].id.toHexString());
  });
});
