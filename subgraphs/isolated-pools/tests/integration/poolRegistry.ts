import '@nomiclabs/hardhat-ethers';
import { ApolloFetch, FetchResult } from 'apollo-fetch';
// Test
import { expect } from 'chai';
// Utils
import { exec, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

// Queries
import { queryPools } from './queries';
import deploy from './utils/deploy';

describe('Pools', function () {
  let subgraph: ApolloFetch;

  const syncDelay = 2000;

  before(async function () {
    this.timeout(50000); // sometimes it takes a long time
    ({ subgraph } = await deploy());
  });

  after(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`, __dirname);

    process.stdout.write('Clean up complete.');
  });

  it('indexes pools', async function () {
    await waitForSubgraphToBeSynced(syncDelay);

    const query = await queryPools();
    const response = (await subgraph({ query })) as FetchResult;
    const data = response.data.pools;

    expect(data.length).to.equal(1);
    const pool = data[0];
    expect(pool.id).to.be.equal('0x5e3d0fde6f793b3115a9e7f5ebc195bbeed35d6c');
    expect(pool.name).to.be.equal('Pool 1');
    expect(pool.creator).to.be.equal('0x68b1d87f95878fe05b998f19b66f4baba5de1aed');
    expect(pool.blockPosted).to.be.equal('44');
    expect(pool.riskRating).to.be.equal('VERY_HIGH_RISK');
    expect(pool.category).to.be.equal('');
    expect(pool.logoURL).to.be.equal('');
    expect(pool.description).to.be.equal('');
    expect(pool.priceOracle).to.be.equal('0xdc64a140aa3e981100a9beca4e685f962f0cf6c9');
    expect(pool.pauseGuardian).to.be.equal('0xd0d0000000000000000000000000000000000000');
    expect(pool.closeFactor).to.be.equal('50000000000000000');
    expect(pool.liquidationIncentive).to.be.equal('1000000000000000000');
    expect(pool.maxAssets).to.be.equal('0');
  });

  it('indexes pool rename event', async function () {
    await waitForSubgraphToBeSynced(syncDelay);

    const query = await queryPools();
    const response = (await subgraph({ query })) as FetchResult;
    const data = response.data.pools;

    const pool = data[0];
    expect(pool.name).to.be.equal('New Pool 1');
  });
});
