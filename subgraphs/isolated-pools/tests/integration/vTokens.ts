import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';
import deploy from './utils/deploy';
import { Contract } from 'ethers';

describe('VToken events', function () {
  const syncDelay = 2000;
  let root: SignerWithAddress;
  let acc1: SignerWithAddress;
  let bswTokenContract: Contract

  const vBSWMarketId = '0x532b02bd614fd18aee45603d02866cfb77575cb3';

  before(async function () {
    this.timeout(500000); // sometimes it takes a long time
    await deploy();
    const signers = await ethers.getSigners();
    [root, acc1] = signers;

    const { data } = await subgraphClient.getMarkets();
    expect(data).to.not.be.equal(undefined);
    const { markets } = data!;

    bswTokenContract = await ethers.getContract('MockBSW');
    let tx = await bswTokenContract.faucet(1000000);
    await tx.wait(1);
    tx = await bswTokenContract.approve(markets[0].id, 1000000);
    await tx.wait(1);
    tx = await bswTokenContract.transfer(root.address, 500000);
    await tx.wait(1);
    tx = await bswTokenContract.transfer(acc1.address, 500000);
    await tx.wait(1);
  });

  it('handles BadDebtIncreased event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets: marketsBeforeUpdate } = dataBeforeEvent!;

    expect(marketsBeforeUpdate[0].badDebt).to.equal(
      '0',
    );

    const vTokenContract = await ethers.getContractAt('VToken', marketsBeforeUpdate[0].id);
    let tx = await vTokenContract.connect(acc1).borrow(500000);
    await tx.wait(1);
    tx = await vTokenContract.connect(marketsBeforeUpdate[0].pool.id).healBorrow(root.address, acc1.address, 100);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets } = data!;

    expect(markets[0].badDebt).to.equal(100);
  });

  it('handles NewComptroller event', async function () {
    const newComptroller = '0xfd36e2c2a6789db23113685031d7f16329158384';
    const { data: dataBeforeEvent } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets: marketsBeforeUpdate } = dataBeforeEvent!;

    expect(marketsBeforeUpdate[0].comptroller).to.equal(
      '0x9467a509da43cb50eb332187602534991be1fea4',
    );

    const vTokenContract = await ethers.getContractAt('VToken', marketsBeforeUpdate[0].id);
    const tx = await vTokenContract.connect(root).setComptroller(newComptroller);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets } = data!;

    expect(markets[0].comptroller).to.equal(newComptroller);
  });

  it('handles NewAccessControlManager event', async function () {
    const newACM = '0x0000000000000000000000000000000000000123';
    const { data: dataBeforeEvent } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets: marketsBeforeUpdate } = dataBeforeEvent!;

    console.log(marketsBeforeUpdate[0].accessControlManager);
    expect(marketsBeforeUpdate[0].accessControlManager).to.equal(
      '0xc5a5c42992decbae36851359345fe25997f5c42d',
    );

    const vTokenContract = await ethers.getContractAt('VToken', marketsBeforeUpdate[0].id);
    const tx = await vTokenContract.connect(root).setAccessControlAddress(newACM);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets } = data!;

    expect(markets[0].accessControlManager).to.equal(newACM);
  });

  it('handles Approval event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getApprovedTransferAllowances();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { approvedTransferAllowances: allowancesBeforeEvent } = dataBeforeEvent!;
    expect(allowancesBeforeEvent).to.not.be.equal(undefined);

    expect(allowancesBeforeEvent.length).to.be.equals(0);

    const { data: marketDataBeforeEvent } = await subgraphClient.getMarketById(vBSWMarketId);
    expect(marketDataBeforeEvent).to.not.be.equal(undefined);
    const { market: marketBeforeEvent } = marketDataBeforeEvent!;
    expect(marketBeforeEvent).to.not.be.equal(undefined);

    const vTokenContract = await ethers.getContractAt('VToken', marketBeforeEvent!.id);
    const tx = await vTokenContract.approve(acc1.address, 1000000);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getApprovedTransferAllowances();
    expect(data).to.not.be.equal(undefined);
    const { approvedTransferAllowances } = data!;
    expect(approvedTransferAllowances).to.not.be.equal(undefined);

    expect(approvedTransferAllowances.length).to.be.equal(1);
  });

  it('handles ReservesAdded event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(vBSWMarketId);
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { market: marketBeforeEvent } = dataBeforeEvent!;
    expect(marketBeforeEvent).to.not.be.equal(undefined);

    expect(marketBeforeEvent?.reserves).to.be.equals('0');

    await waitForSubgraphToBeSynced(syncDelay);

    const vTokenContract = await ethers.getContractAt('VToken', marketBeforeEvent!.id);
    const tx = await vTokenContract.addReserves(12345);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBSWMarketId);
    expect(data).to.not.be.equal(undefined);
    const { market } = data!;

    expect(market?.reserves).to.be.equal('12345');
  });

  it('handles ReservesReduced event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(vBSWMarketId);
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { market: marketBeforeEvent } = dataBeforeEvent!;
    expect(marketBeforeEvent).to.not.be.equal(undefined);

    expect(marketBeforeEvent?.reserves).to.be.equals('0');

    await waitForSubgraphToBeSynced(syncDelay);

    const vTokenContract = await ethers.getContractAt('VToken', marketBeforeEvent!.id);

    vTokenContract.reduceReserves(12345);
    waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBSWMarketId);
    expect(data).to.not.be.equal(undefined);
    const { market } = data!;

    expect(market?.reserves).to.be.equal('0');
  });
});
