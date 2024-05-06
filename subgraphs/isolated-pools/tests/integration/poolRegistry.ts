import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';
import { defaultPools } from './constants';

describe('Pool Registry', function () {
  let root: SignerWithAddress;
  let accessControlManager: Contract;
  const category = 'Games';
  const logoUrl = 'https://images.com/gamer-cat.png';
  const description = 'Cat Games';

  let poolRegistry: any;

  const syncDelay = 2000;

  before(async function () {
    [root] = await ethers.getSigners();
    poolRegistry = await ethers.getContract('PoolRegistry');

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
    const { data } = await subgraphClient.getPools();
    const { pools } = data!;

    expect(pools.length).to.equal(2);
    const poolLens = await ethers.getContract('PoolLens');

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
    const { data: dataBeforeUpdate } = await subgraphClient.getPool(
      defaultPools[1].id.toLowerCase(),
    );
    const { pool: poolBeforeUpdate } = dataBeforeUpdate!;

    const poolLens = await ethers.getContract('PoolLens');
    const onChainPool = await poolLens.getPoolByComptroller(
      poolRegistry.address,
      poolBeforeUpdate.id,
    );
    expect(poolBeforeUpdate.category).to.equal(onChainPool.category);
    expect(poolBeforeUpdate.logoUrl).to.equal('');
    expect(poolBeforeUpdate.description).to.equal(onChainPool.description);

    const tx = await poolRegistry.updatePoolMetadata(defaultPools[1].id, [
      'Games',
      logoUrl,
      description,
    ]);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPool(poolBeforeUpdate.id.toLowerCase());
    const { pool } = data!;
    expect(pool.category).to.equal(category);
    expect(pool.logoUrl).to.equal(logoUrl);
    expect(pool.description).to.equal(description);
  });

  it('sets the pool name', async function () {
    const newName = 'New Pool 1';
    const { data: dataBeforeUpdate } = await subgraphClient.getPools();
    const { pools: poolsBeforeUpdate } = dataBeforeUpdate!;
    const tx = await poolRegistry.setPoolName(poolsBeforeUpdate[0].id, newName);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();

    const { pools } = data!;
    const pool = pools[0];
    expect(pool.name).to.be.equal(newName);
  });
});
