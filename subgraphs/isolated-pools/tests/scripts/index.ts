import { providers } from '@0xsequence/multicall';
import { ethers } from 'ethers';

import createSubgraphClient from '../../subgraph-client';
import checkMarketPositions from './checkMarketPositions';
import checkComptroller from './checkComptroller';
import checkMarkets from './checkMarkets';

import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const run = async () => {
  const NETWORK = process.argv[2];
  const provider = new providers.MulticallProvider(
    new ethers.providers.JsonRpcProvider(process.env[`RPC_${NETWORK}`]),
  );

  const subgraphClient = createSubgraphClient(process.env[`SUBGRAPH_URL_${NETWORK}`] as string);

  await checkComptroller(provider, subgraphClient);
  await checkMarkets(provider, subgraphClient);
  await checkMarketPositions(provider, subgraphClient);
};

export default run();
