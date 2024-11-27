import { ethers } from 'ethers';

import createSubgraphClient from '../../subgraph-client';
import checkAccountVTokens from './checkAccountVTokens';
import checkComptroller from './checkComptroller';
import checkMarkets from './checkMarkets';

import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const run = async () => {
  const NETWORK = process.argv[2];
  const provider = new ethers.providers.JsonRpcProvider(process.env[`RPC_${NETWORK}`] as string);

  const subgraphClient = createSubgraphClient(process.env[`SUBGRAPH_URL_${NETWORK}`] as string);

  await checkComptroller(provider, subgraphClient);
  await checkMarkets(provider, subgraphClient);
  await checkAccountVTokens(provider, subgraphClient);
};

export default run();
