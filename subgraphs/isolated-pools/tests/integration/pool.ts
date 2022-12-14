import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { exec, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';
import deploy from './utils/deploy';

describe('Pools', function () {
  let acc1: Signer;

  const syncDelay = 3000;

  before(async function () {
    const signers = await ethers.getSigners();
    acc1 = signers[1];
    await deploy();
  });

  after(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`, __dirname);

    process.stdout.write('Clean up complete.');
  });

  it('handles MarketAdded event', async function () {
    // Check market pools
    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;
    const pool = pools[0];
    expect(pool.markets.length).to.equal(2);
    // check markets
    const { data: marketsData } = await subgraphClient.getMarkets();
    expect(marketsData).to.not.be.equal(undefined);
    const { markets } = marketsData!;
    expect(markets.length).to.equal(2);
  });

  it('handles MarketEntered and MarketExited events', async function () {
    const account1Address = await acc1.getAddress();
    await waitForSubgraphToBeSynced(syncDelay * 2);

    // check account
    const { data } = await subgraphClient.getAccountById(account1Address.toLowerCase());
    expect(data).to.not.be.equal(undefined);
    const { account } = data!;
    expect(account?.id).to.equal(account1Address.toLowerCase());
    expect(account?.tokens.length).to.equal(2);
    expect(account?.countLiquidated).to.equal(0);
    expect(account?.countLiquidator).to.equal(0);
    expect(account?.hasBorrowed).to.equal(false);

    // check accountVTokens
    // const accountVTokenId = `${account?.tokens[0].id}-${account1Address}`;
    const { data: accountVTokensData } = await subgraphClient.getAccountVTokens();
    expect(accountVTokensData).to.not.be.equal(undefined);
    const { accountVTokens } = accountVTokensData!;

    const symbols = ['vBSW', 'vBNX'];

    accountVTokens.forEach((avt, idx) => {
      expect(avt.id).to.equal(account?.tokens[idx].id);
      const expectedMarketId = account?.tokens[idx].id.split('-')[0];
      expect(avt.market.id).to.equal(expectedMarketId);
      expect(avt.symbol).to.equal(symbols[idx]);
      expect(avt.account.id).to.equal(account?.id);
      expect(avt.transactions.length).to.equal(0);
      expect(avt.enteredMarket).to.equal(true);
      expect(avt.vTokenBalance).to.equal('0');
      expect(avt.totalUnderlyingSupplied).to.equal('0');
      expect(avt.totalUnderlyingRedeemed).to.equal('0');
      expect(avt.accountBorrowIndex).to.equal('0');
      expect(avt.totalUnderlyingBorrowed).to.equal('0');
      expect(avt.totalUnderlyingRepaid).to.equal('0');
      expect(avt.storedBorrowBalance).to.equal('0');
    });

    // check accountVTokenTransaction
    const { data: accountVTokensTransactionData } =
      await subgraphClient.getAccountVTokensTransactions();
    expect(accountVTokensTransactionData).to.not.be.equal(undefined);
    const { accountVTokenTransactions } = accountVTokensTransactionData!;
    // @TODO write assertions
    expect(accountVTokenTransactions[0].id).to.equal(true);
  });

  it('handles NewCloseFactor event', async function () {
    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;
    // @TODO this event is fired from deployment
    // Could test by refiring event
    pools.forEach(p => {
      expect(p.closeFactor).to.equal('50000000000000000');
    });
  });

  it('handles NewCollateralFactor event', async function () {
    const { data } = await subgraphClient.getMarkets();
    expect(data).to.not.be.equal(undefined);
    const { markets } = data!;
    // @TODO this event is fired from deployment
    // Could test by refiring event
    markets.forEach(m => {
      expect(m.collateralFactor).to.equal('0');
    });
  });

  it('handles NewLiquidationIncentive event', async function () {
    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;
    // @TODO this event is fired from deployment
    // Could test by refiring event
    pools.forEach(p => {
      expect(p.liquidationIncentive).to.equal('1000000000000000000');
    });
  });

  it('handles NewPriceOracle event', async function () {
    // @TODO
  });

  it('handles PoolActionPaused event', async function () {
    // @TODO
  });

  it('handles MarketActionPaused event', async function () {
    // @TODO
  });

  it('handles NewBorrowCap event', async function () {
    // @TODO
  });

  it('handles NewMinLiquidatableCollateral event', async function () {
    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;
    // @TODO this event is fired from deployment
    // Could test by refiring event
    pools.forEach(p => {
      expect(p.minLiquidatableCollateral).to.equal('100000000000000000000');
    });
  });
});
