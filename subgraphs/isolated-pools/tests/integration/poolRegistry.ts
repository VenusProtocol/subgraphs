import { ApolloFetch, FetchResult } from 'apollo-fetch';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { exec, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import { queryPools } from './queries';
import deploy from './utils/deploy';

describe('Pool Registry', function () {
  let subgraph: ApolloFetch;

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
    const query = await queryPools();
    let response = (await subgraph({ query })) as FetchResult;
    let data = response.data.pools;

    const pool1Address = '0x9467A509DA43CB50EB332187602534991Be1fEa4';
    expect(data.length).to.equal(1);
    let pool = data[0];
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

    const newName = 'New Pool 1';
    const poolRegistry = await ethers.getContract('PoolRegistry');

    // @todo Break this out into a seperate test
    let tx = await poolRegistry.setPoolName(pool1Address, newName);
    await tx.wait(1);

    await waitForSubgraphToBeSynced(syncDelay);

    response = (await subgraph({ query })) as FetchResult;
    data = response.data.pools;

    pool = data[0];
    expect(pool.name).to.be.equal(newName);

    const category = 'Games';
    const logoUrl = 'https://images.com/gamer-cat.png';
    const description = 'Cat Games';

    tx = await poolRegistry.updatePoolMetadata(pool1Address, {
      riskRating: 2,
      category: 'Games',
      logoURL: logoUrl,
      description,
    });
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    // Check market pools
    // @todo Break this out into a seperate test
    const poolQuery = await queryPools();
    response = (await subgraph({ query: poolQuery })) as FetchResult;
    data = response.data.pools;
    pool = data[0];
    expect(pool.riskRating).to.equal('MEDIUM_RISK');
    expect(pool.category).to.equal(category);
    expect(pool.logoUrl).to.equal(logoUrl);
    expect(pool.description).to.equal(description);
  });
});
