import { providers } from '@0xsequence/multicall';
import { abi as ComptrollerAbi } from '@venusprotocol/isolated-pools/artifacts/contracts/Comptroller.sol/Comptroller.json';
import { ethers } from 'ethers';
import { MarketsQuery } from '../../subgraph-client/.graphclient';

import createSubgraphClient from '../../subgraph-client';
import { assertEqual } from '@venusprotocol/subgraph-utils';

const { getAddress } = ethers.utils;

const checkComptroller = async (
  provider: providers.MulticallProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  const { pools } = await subgraphClient.getPools();
  for (const pool of pools) {
    const comptrollerContract = new ethers.Contract(pool.id, ComptrollerAbi, provider);
    const [
      closeFactor,
      priceOracleAddress,
      liquidationIncentive,
      minLiquidatableCollateralMantissa,
      allMarkets,
    ] = await Promise.all([
      comptrollerContract.closeFactorMantissa(),
      comptrollerContract.oracle(),
      comptrollerContract.liquidationIncentiveMantissa(),
      comptrollerContract.minLiquidatableCollateral(),
      comptrollerContract.getAllMarkets(),
    ]);
    try {
      assertEqual(pool, priceOracleAddress, 'priceOracleAddress', getAddress);
      assertEqual(pool, closeFactor, 'closeFactorMantissa');
      assertEqual(pool, liquidationIncentive, 'liquidationIncentiveMantissa');
      assertEqual(pool, minLiquidatableCollateralMantissa, 'minLiquidatableCollateralMantissa');
      const mapped = allMarkets.map((m: MarketsQuery['markets']) => m);
      mapped.sort();
      assertEqual(pool, mapped, 'markets', (markets: MarketsQuery['markets']) => {
        const ids = markets.map(m => {
          return getAddress(m.id);
        });
        ids.sort();
        return ids;
      });
      console.log(`correct values on comptroller entity - ${pool.id}`);
    } catch (e) {
      console.log(e.message);
    }
  }
};

export default checkComptroller;
