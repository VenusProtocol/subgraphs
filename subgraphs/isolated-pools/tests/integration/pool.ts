import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { exec, subgraphClient, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

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
    const queryPools = () => subgraphClient.Pools();
    const { pools } = await queryPools();
    const pool = pools[0];
    expect(pool.markets.length).to.equal(2);
    // check markets
    const queryMarkets = () => subgraphClient.Markets();
    const marketsResponse = await queryMarkets();
    expect(marketsResponse.markets.length).to.equal(2);
  });

  it('handles MarketEntered and MarketExited event', async function () {
    const account1Address = await acc1.getAddress();
    await waitForSubgraphToBeSynced(syncDelay * 2);

    // check account
    const queryAccounts = () => subgraphClient.AccountById({ id: account1Address });
    const { account } = await queryAccounts();
    expect(account?.id).to.equal(account1Address.toLowerCase());
    expect(account?.tokens.length).to.equal(2);
    expect(account?.countLiquidated).to.equal(0);
    expect(account?.countLiquidator).to.equal(0);
    expect(account?.hasBorrowed).to.equal(false);

    // check accountVTokens
    // const accountVTokenId = `${account?.tokens[0].id}-${account1Address}`;
    const queryAccountVTokens = () => subgraphClient.AccountVTokens();
    const { accountVTokens } = await queryAccountVTokens();

    accountVTokens.forEach(avt => {
      expect(avt.market.id).to.equal(account?.tokens[0].id);
      expect(avt.symbol).to.equal(0);
      expect(avt.account).to.equal(0);
      expect(avt.transactions).to.equal(0);
      expect(avt.enteredMarket).to.equal(true);
      expect(avt.vTokenBalance).to.equal(true);
      expect(avt.totalUnderlyingSupplied).to.equal(true);
      expect(avt.totalUnderlyingRedeemed).to.equal(true);
      expect(avt.accountBorrowIndex).to.equal(true);
      expect(avt.totalUnderlyingBorrowed).to.equal(true);
      expect(avt.totalUnderlyingRepaid).to.equal(true);
      expect(avt.storedBorrowBalance).to.equal(true);
    });

    // check accountVTokenTransaction
    const queryAccountVTokenTransactions = () => subgraphClient.AccountVTokenTransactions();
    const accVTokenTransactionsResponse = await queryAccountVTokenTransactions();
    const { accountVTokenTransactions } = accVTokenTransactionsResponse;
    // @TODO write assertions
    expect(accountVTokenTransactions[0].id).to.equal(true);
  });

  it('handles NewCloseFactor event', async function () {
    const queryPools = () => subgraphClient.Pools();
    const { pools } = await queryPools();
    // @TODO this event is fired from deployment
    // Could test by refiring event
    pools.forEach(p => {
      expect(p.closeFactor).to.equal('50000000000000000');
    });
  });

  it('handles NewCollateralFactor event', async function () {
    const queryMarkets = () => subgraphClient.Markets();
    const response = await queryMarkets();
    const { markets } = response;
    // @TODO this event is fired from deployment
    // Could test by refiring event
    markets.forEach(p => {
      expect(p.collateralFactor).to.equal('0');
    });
  });

  it('handles NewLiquidationIncentive event', async function () {
    const queryPools = () => subgraphClient.Pools();
    const { pools } = await queryPools();
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
    const queryPools = () => subgraphClient.Pools();
    const { pools } = await queryPools();
    // @TODO this event is fired from deployment
    // Could test by refiring event
    pools.forEach(p => {
      expect(p.minLiquidatableCollateral).to.equal(0);
    });
  });
});
