import { ApolloFetch, FetchResult } from 'apollo-fetch';
// Utils
import { exec, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

// Queries
import { queryPools } from './queries';
import deploy from './utils/deploy';

jest.setTimeout(50000); // sometimes it takes a long time

// Test
describe('Pools', function () {
  let subgraph: ApolloFetch;

  const syncDelay = 2000;

  beforeAll(async function () {
    ({ subgraph } = await deploy());
  });

  afterAll(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`, __dirname);

    process.stdout.write('Clean up complete.');
  });

  it('indexes pools', async function () {
    await waitForSubgraphToBeSynced(syncDelay);

    const query = await queryPools();
    const response = (await subgraph({ query })) as FetchResult;
    const data = response.data.pools;
    console.log(data);
    expect(data).toHaveLength(1);
    const pool = data[0];
    expect(pool.id).toBe('0x5e3d0fde6f793b3115a9e7f5ebc195bbeed35d6c');
    expect(pool.name).toBe('Pool 1');
    expect(pool.creator).toBe('0x68b1d87f95878fe05b998f19b66f4baba5de1aed');
    expect(pool.blockPosted).toBe('44');
    expect(pool.riskRating).toBe('VERY_HIGH_RISK');
    expect(pool.category).toBe('');
    expect(pool.logoURL).toBe('');
    expect(pool.description).toBe('');
    expect(pool.priceOracle).toBe('0xdc64a140aa3e981100a9beca4e685f962f0cf6c9');
    expect(pool.pauseGuardian).toBe('0xd0d0000000000000000000000000000000000000');
    expect(pool.closeFactor).toBe('50000000000000000');
    expect(pool.liquidationIncentive).toBe('1000000000000000000');
    expect(pool.maxAssets).toBe('0');
  });
});
