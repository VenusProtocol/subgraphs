import { providers } from '@0xsequence/multicall';
import { abi as RewardsDistributorAbi } from '@venusprotocol/isolated-pools/artifacts/contracts/Rewards/RewardsDistributor.sol/RewardsDistributor.json';
import { assertEqual } from '@venusprotocol/subgraph-utils';
import { ethers } from 'ethers';
import createSubgraphClient from '../../subgraph-client';

const { getAddress } = ethers.utils;

const checkRewardsDistributors = async (
  provider: providers.MulticallProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  const { rewardsDistributors } = await subgraphClient.getRewardsDistributors();
  for (const rd of rewardsDistributors) {
    const rewardDistributor = new ethers.Contract(rd.address, RewardsDistributorAbi, provider);
    let isTimeBased = false;
    try {
      isTimeBased = await rewardDistributor.isTimeBased();
    } catch (e) {
      console.log('failed to query isTimeBased');
    }
    assertEqual(rd, isTimeBased, 'isTimeBased');
    assertEqual(rd, await rewardDistributor.rewardToken(), 'rewardTokenAddress', getAddress);

    for (const marketReward of rd.marketRewards) {
      const [borrowSpeedPerBlockMantissa, supplySpeedPerBlockMantissa] = await Promise.all([
        rewardDistributor.rewardTokenBorrowSpeeds(marketReward.market.address),
        rewardDistributor.rewardTokenSupplySpeeds(marketReward.market.address),
      ]);
      let supplyStateIndex;
      let borrowStateIndex;
      let supplyStateBlockNumberOrTimestamp;
      let borrowStateBlockNumberOrTimestamp;
      let supplyStateLastRewardingBlockTimestamp;
      let borrowStateLastRewardingBlockTimestamp;
      if (isTimeBased) {
        const supplyState = await rewardDistributor.rewardTokenSupplyStateTimeBased(
          marketReward.market.address,
        );
        const borrowState = await rewardDistributor.rewardTokenBorrowStateTimeBased(
          marketReward.market.address,
        );

        supplyStateIndex = supplyState.index;
        borrowStateIndex = borrowState.index;
        supplyStateBlockNumberOrTimestamp = supplyState.timestamp;
        borrowStateBlockNumberOrTimestamp = borrowState.timestamp;
        supplyStateLastRewardingBlockTimestamp = supplyState.lastRewardingBlock;
        borrowStateLastRewardingBlockTimestamp = borrowState.lastRewardingBlock;
      } else {
        const supplyState = await rewardDistributor.rewardTokenSupplyState(
          marketReward.market.address,
        );
        const borrowState = await rewardDistributor.rewardTokenBorrowState(
          marketReward.market.address,
        );

        supplyStateIndex = supplyState.index;
        borrowStateIndex = borrowState.index;
        supplyStateBlockNumberOrTimestamp = supplyState.block;
        borrowStateBlockNumberOrTimestamp = borrowState.block;
        supplyStateLastRewardingBlockTimestamp = supplyState.lastRewardingBlock;
        borrowStateLastRewardingBlockTimestamp = borrowState.lastRewardingBlock;
      }
      // market
      assertEqual(marketReward, borrowSpeedPerBlockMantissa, 'borrowSpeedPerBlockMantissa');
      assertEqual(marketReward, supplySpeedPerBlockMantissa, 'supplySpeedPerBlockMantissa');
      assertEqual(marketReward, supplyStateIndex, 'supplyStateIndex');
      assertEqual(
        marketReward,
        supplyStateBlockNumberOrTimestamp,
        'supplyStateBlockNumberOrTimestamp',
      );
      assertEqual(marketReward, borrowStateIndex, 'borrowStateIndex');
      assertEqual(
        marketReward,
        borrowStateBlockNumberOrTimestamp,
        'borrowStateBlockNumberOrTimestamp',
      );
      assertEqual(
        marketReward,
        supplyStateLastRewardingBlockTimestamp || 0,
        'supplyLastRewardingBlockTimestamp',
      );
      assertEqual(
        marketReward,
        borrowStateLastRewardingBlockTimestamp || 0,
        'borrowLastRewardingBlockTimestamp',
      );
    }
  }
};

export default checkRewardsDistributors;
