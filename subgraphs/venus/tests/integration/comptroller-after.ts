import { waitForSubgraphToBeSynced } from '@venusprotocol/subgraph-utils';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import createSubgraphClient from '../../subgraph-client';

const subgraphClient = createSubgraphClient(
  'http://graph-node:8000/subgraphs/name/venusprotocol/venus-subgraph',
);

const syncDelay = 2000;

describe('VToken events', function () {
  let comptroller: Contract;
  let vUsdcToken: Contract;
  let vWBnbToken: Contract;
  let vEthToken: Contract;
  let vDogeToken: Contract;
  let vFdusdToken: Contract;
  let vUsdtToken: Contract;
  let markets: string[];

  before(async function () {
    comptroller = await ethers.getContract('Unitroller');
    vUsdcToken = await ethers.getContract('vUSDC');
    vWBnbToken = await ethers.getContract('vBNB');
    vEthToken = await ethers.getContract('vETH');

    vDogeToken = await ethers.getContract('vDOGE');
    vFdusdToken = await ethers.getContract('vFDUSD');
    vUsdtToken = await ethers.getContract('vUSDT');

    markets = [
      vUsdcToken.address,
      vWBnbToken.address,
      vEthToken.address,
      vDogeToken.address,
      vFdusdToken.address,
      vUsdtToken.address,
    ];

    await comptroller._setMarketBorrowCaps(markets, [0, 0, 0, 0, 0, 0]);
    await comptroller._setMarketSupplyCaps(markets, [0, 0, 0, 0, 0, 0]);
    for (const market of markets) {
      await comptroller._setCollateralFactor(market, 0);
    }
  });

  it('should delist market correctly', async function () {
    // Pause all actions
    const actions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    await comptroller._setActionsPaused(markets, actions, true);

    for (const market of markets) {
      await comptroller.unlistMarket(market);
    }

    await waitForSubgraphToBeSynced(syncDelay);

    for (const market of markets) {
      const { market: unlistedMarket } = await subgraphClient.getMarketById(market.toLowerCase());

      expect(unlistedMarket.isListed).to.equal(false);
    }
  });
});
