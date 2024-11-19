import { providers } from '@0xsequence/multicall';
import { abi as ComptrollerAbi } from '@venusprotocol/venus-protocol/artifacts/contracts/Comptroller/Diamond/DiamondConsolidated.sol/DiamondConsolidated.json';
import { ethers } from 'ethers';
import { assertEqual } from 'venus-subgraph-utils';

import createSubgraphClient from '../../subgraph-client';

const { getAddress } = ethers.utils;

const checkComptroller = async (
  provider: providers.MulticallProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  const { comptroller } = await subgraphClient.getComptroller();
  const comptrollerContract = new ethers.Contract(comptroller.id, ComptrollerAbi, provider);
  const [priceOracle, closeFactorMantissa, liquidationIncentive, maxAssets] = await Promise.all([
    comptrollerContract.oracle(),
    comptrollerContract.closeFactorMantissa(),
    comptrollerContract.liquidationIncentiveMantissa(),
    comptrollerContract.maxAssets(),
  ]);
  try {
    assertEqual(comptroller, priceOracle, 'priceOracle', getAddress);
    assertEqual(comptroller, closeFactorMantissa, 'closeFactorMantissa');
    assertEqual(comptroller, liquidationIncentive, 'liquidationIncentive');
    assertEqual(comptroller, maxAssets, 'maxAssets');
    console.log(`correct values on comptroller entity - ${comptroller.id}`);
  } catch (e) {
    console.log(e.message);
  }
};

export default checkComptroller;
