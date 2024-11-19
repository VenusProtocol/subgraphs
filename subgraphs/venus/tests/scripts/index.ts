import { providers } from '@0xsequence/multicall';
import { ethers } from 'ethers';

import createSubgraphClient from '../../subgraph-client';
import checkAccountVTokens from './checkAccountVTokens';
import checkComptroller from './checkComptroller';
import checkMarkets from './checkMarkets';

const run = async () => {
  const provider = new providers.MulticallProvider(
    new ethers.providers.JsonRpcProvider(process.env.RPC),
  );

  const subgraphClient = createSubgraphClient(process.env.SUBGRAPH_URL);

  await checkComptroller(provider, subgraphClient);
  await checkMarkets(provider, subgraphClient);
  await checkAccountVTokens(provider, subgraphClient);
};

export default run();
