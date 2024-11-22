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
  });

  it('should list market correctly', async function () {
    const txs = [];
    for (const market of markets) {
      const tx = await comptroller._supportMarket(market);
      txs.push(tx);
    }

    await waitForSubgraphToBeSynced(syncDelay);

    for (const [idx, market] of markets.entries()) {
      const {
        data: { market: listedMarket },
      } = await subgraphClient.getMarketById(market.toLowerCase());

      expect(listedMarket.isListed).to.equal(true);
      expect(listedMarket.collateralFactorMantissa).to.equal('0');
      expect(listedMarket.xvsSupplyStateBlock).to.equal(
        Number(BigInt.asUintN(32, BigInt(txs[idx].blockNumber))).toString(),
      );
      expect(listedMarket.xvsSupplyStateIndex).to.equal('1000000000000000000000000000000000000');
      expect(listedMarket.xvsBorrowStateBlock).to.equal(
        Number(BigInt.asUintN(32, BigInt(txs[idx].blockNumber))).toString(),
      );
      expect(listedMarket.xvsBorrowStateIndex).to.equal('1000000000000000000000000000000000000');
    }
  });
});
