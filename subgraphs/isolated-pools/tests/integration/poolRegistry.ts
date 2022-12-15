import { expect } from 'chai';
import { ethers } from 'hardhat';
import { exec, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';
import deploy from './utils/deploy';

const DEFAULT_POOL = {
  name: 'Pool 1',
  creator: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  riskRating: 'VERY_HIGH_RISK',
  category: '',
  logoUrl: '',
  description: '',
  priceOracle: '0x0165878a594ca255338adfa4d48449f69242eb8f',
  closeFactor: '50000000000000000',
  liquidationIncentive: '1000000000000000000',
  maxAssets: '0',
};

describe('Pool Registry', function () {
  const pool1Address = '0x9467A509DA43CB50EB332187602534991Be1fEa4';
  const category = 'Games';
  const logoUrl = 'https://images.com/gamer-cat.png';
  const description = 'Cat Games';

  let poolRegistry: any;

  const syncDelay = 2000;

  before(async function () {
    this.timeout(500000); // sometimes it takes a long time
    await deploy();
    poolRegistry = await ethers.getContract('PoolRegistry');
  });

  after(async function () {
    await poolRegistry.setPoolName(pool1Address, DEFAULT_POOL.name);
    const tx = await poolRegistry.updatePoolMetadata(pool1Address, [
      0,
      DEFAULT_POOL.category,
      DEFAULT_POOL.logoUrl,
      DEFAULT_POOL.description,
    ]);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`, __dirname);

    process.stdout.write('Clean up complete.');
  });

  it('indexes pool registry events', async function () {
    const { data } = await subgraphClient.getPools();

    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;
    expect(pools.length).to.equal(1);
    const pool = pools[0];
    expect(pool.id).to.be.equal(pool1Address.toLocaleLowerCase());
    expect(pool.name).to.be.equal(DEFAULT_POOL.name);
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

  it('updates and returns metadata from the pool', async function () {
    const { data: dataBeforeUpdate } = await subgraphClient.getPools();
    expect(dataBeforeUpdate).to.not.be.equal(undefined);
    const { pools: poolsBeforeUpdate } = dataBeforeUpdate!;
    const poolBeforeUpdate = poolsBeforeUpdate[0];
    expect(poolBeforeUpdate.riskRating).to.equal(DEFAULT_POOL.riskRating);
    expect(poolBeforeUpdate.category).to.equal(DEFAULT_POOL.category);
    expect(poolBeforeUpdate.logoUrl).to.equal(DEFAULT_POOL.logoUrl);
    expect(poolBeforeUpdate.description).to.equal(DEFAULT_POOL.description);

    const tx = await poolRegistry.updatePoolMetadata(pool1Address, [
      2,
      'Games',
      logoUrl,
      description,
    ]);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;
    const pool = pools[0];
    expect(pool.riskRating).to.equal('MEDIUM_RISK');
    expect(pool.category).to.equal(category);
    expect(pool.logoUrl).to.equal(logoUrl);
    expect(pool.description).to.equal(description);
  });

  it('sets the pool name', async function () {
    const newName = 'New Pool 1';
    const tx = await poolRegistry.setPoolName(pool1Address, newName);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);

    const { pools } = data!;
    const pool = pools[0];
    expect(pool.name).to.be.equal(newName);
  });
});
