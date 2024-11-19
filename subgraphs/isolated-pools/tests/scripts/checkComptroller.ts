import { abi as ComptrollerAbi } from '@venusprotocol/isolated-pools/artifacts/contracts/Comptroller.sol/Comptroller.json';
import { ethers } from 'ethers';
import { MarketsQuery } from '../../subgraph-client/.graphclient';

import createSubgraphClient from '../../subgraph-client';
import { assertEqual } from '@venusprotocol/subgraph-utils';

const { getAddress } = ethers.utils;

const checkComptroller = async (
  provider: ethers.providers.JsonRpcProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  const { pools } = await subgraphClient.getPools();
  for (const pool of pools) {
    const comptrollerContract = new ethers.Contract(pool.id, ComptrollerAbi, provider);
    const closeFactor = await comptrollerContract.closeFactorMantissa();
    const priceOracleAddress = await comptrollerContract.oracle();
    const liquidationIncentive = await comptrollerContract.liquidationIncentiveMantissa();
    const minLiquidatableCollateralMantissa = await comptrollerContract.minLiquidatableCollateral();
    const allMarkets = await comptrollerContract.getAllMarkets();
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
