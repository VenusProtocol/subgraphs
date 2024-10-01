import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';

const syncDelay = 2000;

describe('VToken events', function () {
  let comptroller: Contract;
  let vBnxAddress: string;
  let vBtcbAddress: string;
  let markets: string[];

  before(async function () {
    const poolRegistry = await ethers.getContract('PoolRegistry');
    const bnxToken = await ethers.getContract('MockBNX');
    const btcbToken = await ethers.getContract('MockBTCB');

    const poolLens = await ethers.getContract('PoolLens');
    const pools = await poolLens.getAllPools(poolRegistry.address);

    const comptrollerAddress = pools[0].comptroller;
    comptroller = await ethers.getContractAt('Comptroller', comptrollerAddress);

    vBnxAddress = await poolRegistry.getVTokenForAsset(comptroller.address, bnxToken.address);
    vBtcbAddress = await poolRegistry.getVTokenForAsset(comptroller.address, btcbToken.address);

    markets = [vBnxAddress, vBtcbAddress];

    // set BorrowCaps
    await comptroller.setMarketBorrowCaps([vBnxAddress, vBtcbAddress], [0, 0]);
    await comptroller.setMarketSupplyCaps([vBnxAddress, vBtcbAddress], [0, 0]);
    await comptroller.setCollateralFactor(vBnxAddress, 0, 0);
    await comptroller.setCollateralFactor(vBtcbAddress, 0, 0);
  });

  it('should delist market correctly', async function () {
    // Pause all actions
    const actions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    await comptroller.setActionsPaused(markets, actions, true);

    for (const market of markets) {
      await comptroller.unlistMarket(market);
    }

    await waitForSubgraphToBeSynced(syncDelay);

    for (const market of markets) {
      const { market: unlistedMarket } = await subgraphClient.getMarketById(market.toLowerCase());

      expect(unlistedMarket?.isListed).to.equal(false);
    }
  });
});
