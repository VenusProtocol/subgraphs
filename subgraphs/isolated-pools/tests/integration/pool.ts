import { ApolloFetch, FetchResult } from 'apollo-fetch';
import { exec, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';
import { expect } from 'chai';

import { queryPools, queryMarkets } from './queries';
import deploy from './utils/deploy';

describe('Pools', function () {
  let subgraph: ApolloFetch;

  const syncDelay = 2000;

  before(async function () {
    ({ subgraph } = await deploy());
  });

  after(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`, __dirname);

    process.stdout.write('Clean up complete.');
  });

  it('handles MarketAdded event', async function () {
    await waitForSubgraphToBeSynced(syncDelay);

    // Check market pools
    const poolQuery = await queryPools();
    let response = (await subgraph({ query: poolQuery })) as FetchResult;
    const data = response.data.pools;
    const pool = data[0];
    expect(pool.markets.length).to.equal(2);
    // check markets
    const marketQuery = await queryMarkets();
    response = (await subgraph({ query: marketQuery })) as FetchResult;
    expect(response.data.length).to.equal(2);
  });
});
