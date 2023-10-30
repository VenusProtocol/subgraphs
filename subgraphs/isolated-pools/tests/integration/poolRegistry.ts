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

    pools.forEach(pool => {
      const defaultPool = defaultPools.find(dp => pool.id === dp.id);
      expect(pool.id).to.be.equal(defaultPool?.id);
      expect(pool.name).to.be.equal(defaultPool?.name);
      expect(pool.creator).to.be.equal(defaultPool?.creator);
      expect(pool.blockPosted).to.be.string;
      expect(pool.category).to.be.equal(defaultPool?.category);
      expect(pool.logoUrl).to.be.equal(defaultPool?.logoUrl);
      expect(pool.description).to.be.equal(defaultPool?.description);
      expect(pool.priceOracleAddress).to.be.equal(defaultPool?.priceOracleAddress);
      expect(pool.closeFactorMantissa).to.be.equal(defaultPool?.closeFactorMantissa);
      expect(pool.liquidationIncentiveMantissa).to.be.equal(
        defaultPool?.liquidationIncentiveMantissa,
      );
    });
  });

  it('updates and returns metadata from the pool', async function () {
    const { data: dataBeforeUpdate } = await subgraphClient.getPools();
    const { pools: poolsBeforeUpdate } = dataBeforeUpdate!;
    const poolBeforeUpdate = poolsBeforeUpdate[0];
    expect(poolBeforeUpdate.category).to.equal(defaultPools[0].category);
    expect(poolBeforeUpdate.logoUrl).to.equal(defaultPools[0].logoUrl);
    expect(poolBeforeUpdate.description).to.equal(defaultPools[0].description);

    const tx = await poolRegistry.updatePoolMetadata(defaultPools[0].id, [
      'Games',
      logoUrl,
      description,
    ]);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    const { pools } = data!;
    const pool = pools[0];
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
