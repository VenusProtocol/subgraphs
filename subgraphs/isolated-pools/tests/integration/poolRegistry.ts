import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { waitForSubgraphToBeSynced } from '@venusprotocol/subgraph-utils';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import createSubgraphClient from '../../subgraph-client';

const subgraphClient = createSubgraphClient(
  'http://graph-node:8000/subgraphs/name/venusprotocol/venus-isolated-pools',
);

describe('Pool Registry', function () {
  let root: SignerWithAddress;
  let accessControlManager: Contract;
  let poolRegistry: Contract;
  let poolLens: Contract;
  const category = 'Games';
  const logoUrl = 'https://images.com/gamer-cat.png';
  const description = 'Cat Games';

  const syncDelay = 2000;

  before(async function () {
    [root] = await ethers.getSigners();
    poolRegistry = await ethers.getContract('PoolRegistry');
    poolLens = await ethers.getContract('PoolLens');

    // Permissions for easy testing
    accessControlManager = await ethers.getContract('AccessControlManager');

    let tx = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setPoolName(address,string)',
      root.address,
    );
    await tx.wait();

    tx = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'updatePoolMetadata(address,VenusPoolMetaData)',
      root.address,
    );
    await tx.wait();
  });

  it('indexes pool registry events', async function () {
    const { pools } = await subgraphClient.getPools();

    expect(pools.length).to.equal(2);

    pools.forEach(async pool => {
      const onChainPool = await poolLens.getPoolByComptroller(pool.id);
      expect(pool.id).to.be.equal(onChainPool?.comptroller);
      expect(pool.name).to.be.equal(onChainPool?.name);
      expect(pool.creator).to.be.equal(onChainPool?.creator);
      expect(pool.blockPosted).to.be.number;
      expect(pool.category).to.be.equal(onChainPool?.category);
      expect(pool.logoUrl).to.be.equal(onChainPool?.logoURL);
      expect(pool.description).to.be.equal(onChainPool?.description);
      expect(pool.priceOracleAddress).to.be.equal(onChainPool?.priceOracle);
      expect(pool.closeFactorMantissa).to.be.equal(onChainPool?.closeFactor);
      expect(pool.liquidationIncentiveMantissa).to.be.equal(onChainPool?.liquidationIncentive);
    });
  });

  it('updates and returns metadata from the pool', async function () {
    const pools = await poolLens.getAllPools(poolRegistry.address);
    const { pool: poolBeforeUpdate } = await subgraphClient.getPool(
      pools[1].comptroller.toLowerCase(),
    );
    const onChainPool = await poolLens.getPoolByComptroller(
      poolRegistry.address,
      poolBeforeUpdate.id,
    );
    expect(poolBeforeUpdate.category).to.equal(onChainPool.category);
    expect(poolBeforeUpdate.logoUrl).to.equal('');
    expect(poolBeforeUpdate.description).to.equal(onChainPool.description);

    const tx = await poolRegistry.updatePoolMetadata(pools[1].comptroller, [
      'Games',
      logoUrl,
      description,
    ]);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { pool } = await subgraphClient.getPool(poolBeforeUpdate.id.toLowerCase());

    expect(pool.category).to.equal(category);
    expect(pool.logoUrl).to.equal(logoUrl);
    expect(pool.description).to.equal(description);
  });

  it('sets the pool name', async function () {
    const newName = 'New Pool 1';
    const { pools: poolsBeforeUpdate } = await subgraphClient.getPools();

    const tx = await poolRegistry.setPoolName(poolsBeforeUpdate[0].id, newName);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { pools } = await subgraphClient.getPools();

    const pool = pools[0];
    expect(pool.name).to.be.equal(newName);
  });
});
