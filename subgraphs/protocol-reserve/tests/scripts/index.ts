import { providers } from '@0xsequence/multicall';
import { ethers } from 'ethers';

import createSubgraphClient from '../../subgraph-client';
import verifyAccountBalances from './verifyAccountBalances';

const run = async () => {
  const provider = new providers.MulticallProvider(
    new ethers.providers.JsonRpcProvider(process.env.RPC),
  );

  const subgraphClient = createSubgraphClient(process.env.SUBGRAPH_URL as string);

  await verifyAccountBalances(provider, subgraphClient);
};

export default run();
