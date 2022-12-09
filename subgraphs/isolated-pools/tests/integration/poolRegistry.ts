import { ApolloFetch, FetchResult } from 'apollo-fetch';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { exec, subgraphClient, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import deploy from './utils/deploy';

describe('Pool Registry', function () {
  let subgraph: ApolloFetch;
  let query: string;
  const pool1Address = '0x9467A509DA43CB50EB332187602534991Be1fEa4';
  const category = 'Games';
  const logoUrl = 'https://images.com/gamer-cat.png';
  const description = 'Cat Games';

  const syncDelay = 2000;

  before(async function () {
    this.timeout(500000); // sometimes it takes a long time
    ({ subgraph } = await deploy());
  });

  after(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`, __dirname);

    process.stdout.write('Clean up complete.');
  });

  it('indexes pool registry events', async function () {
    const response = () => subgraphClient.Pools();
    const data = (await response()).pools;
    expect(data.length).to.equal(1);
    const pool = data[0];
    expect(pool.id).to.be.equal(pool1Address.toLocaleLowerCase());
    expect(pool.name).to.be.equal('Pool 1');
    expect(pool.creator).to.be.equal('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    expect(pool.blockPosted).to.be.string;
    expect(pool.riskRating).to.be.equal('VERY_HIGH_RISK');
    expect(pool.category).to.be.equal('');
    expect(pool.logoUrl).to.be.equal('');
    expect(pool.description).to.be.equal('');
    expect(pool.priceOracle).to.be.equal('0x0165878a594ca255338adfa4d48449f69242eb8f');
    expect(pool.closeFactor).to.be.equal('50000000000000000');
    expect(pool.liquidationIncentive).to.be.equal('1000000000000000000');
    expect(pool.maxAssets).to.be.equal('0');
  });

  it('sets and updates the pool metadata', async function () {
    const newName = 'New Pool 1';
    const poolRegistry = await ethers.getContract('PoolRegistry');
    let tx = await poolRegistry.setPoolName(pool1Address, newName);
    await tx.wait(1);

    await waitForSubgraphToBeSynced(syncDelay);

    const response = (await subgraph({ query })) as FetchResult;
    const data = response.data.pools;

    const pool = data[0];
    expect(pool.name).to.be.equal(newName);

    tx = await poolRegistry.updatePoolMetadata(pool1Address, {
      riskRating: 2,
      category: 'Games',
      logoURL: logoUrl,
      description,
    });
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);
  });

  it('returns metadata from the pool', async function () {
    const response = () => subgraphClient.Pools();
    const data = (await response()).pools;
    const pool = data[0];
    expect(pool.riskRating).to.equal('MEDIUM_RISK');
    expect(pool.category).to.equal(category);
    expect(pool.logoUrl).to.equal(logoUrl);
    expect(pool.description).to.equal(description);
  });
});
