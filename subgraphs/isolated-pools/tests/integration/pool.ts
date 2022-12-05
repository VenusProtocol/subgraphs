import { ApolloFetch, FetchResult } from 'apollo-fetch';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { exec, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import { Pool } from '../../generated/schema';
import {
  queryAccountVTokenTransactions,
  queryAccountVTokens,
  queryAccounts,
  queryMarkets,
  queryPools,
} from './queries';
import deploy from './utils/deploy';

describe('Pools', function () {
  let subgraph: ApolloFetch;
  let acc1: Signer;
  let pools: Array<Pool> = [];

  const syncDelay = 3000;

  before(async function () {
    const signers = await ethers.getSigners();
    acc1 = signers[1];
    ({ subgraph } = await deploy());
  });

  after(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`, __dirname);

    process.stdout.write('Clean up complete.');
  });

  it('handles MarketAdded event', async function () {
    // Check market pools
    const poolQuery = await queryPools();
    let response = (await subgraph({ query: poolQuery })) as FetchResult;
    pools = response.data.pools;
    const pool = pools[0];
    expect(pool.markets.length).to.equal(2);
    // check markets
    const marketQuery = await queryMarkets();
    response = (await subgraph({ query: marketQuery })) as FetchResult;
    expect(response.data.markets.length).to.equal(2);
  });

  it('handles MarketEntered and MarketExited event', async function () {
    const account1Address = await acc1.getAddress();
    await waitForSubgraphToBeSynced(syncDelay * 2);

    // check account
    const accountsQuery = await queryAccounts(account1Address);
    let response = (await subgraph({ query: accountsQuery })) as FetchResult;
    const { account } = response.data;

    expect(account.id).to.equal(account1Address.toLowerCase());
    expect(account.tokens.length).to.equal(2);
    expect(account.countLiquidated).to.equal(0);
    expect(account.countLiquidator).to.equal(0);
    expect(account.hasBorrowed).to.equal(false);

    // check accountVTokens
    const accountVTokenId = `${account.tokens[0].id}-${account1Address}`;
    const accountVTokensQuery = await queryAccountVTokens(accountVTokenId);
    response = (await subgraph({ query: accountVTokensQuery })) as FetchResult;
    const { accountVTokens } = response.data;

    accountVTokens.forEach(avt => {
      expect(avt.market.id).to.equal(account.tokens[0].id);
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
    const accountVTokenTransactionsQuery = await queryAccountVTokenTransactions();
    response = (await subgraph({ query: accountVTokenTransactionsQuery })) as FetchResult;
    const { accountVTokenTransaction } = response.data.accountVTokenTransactions;
    // @TODO write assertions
    expect(accountVTokenTransaction.account).to.equal(true);
  });

  it('handles NewCloseFactor event', async function () {
    const poolsQuery = await queryPools();
    const response = (await subgraph({ query: poolsQuery })) as FetchResult;
    const { pools } = response.data;
    // @TODO this event is fired from deployment
    // Could test by refiring event
    pools.forEach(p => {
      expect(p.closeFactor).to.equal('50000000000000000');
    });
  });

  it('handles NewCollateralFactor event', async function () {
    const poolsQuery = await queryPools();
    const response = (await subgraph({ query: poolsQuery })) as FetchResult;
    const { pools } = response.data;
    // @TODO this event is fired from deployment
    // Could test by refiring event
    pools.forEach(p => {
      expect(p.collateralFactor).to.equal(0);
    });
  });

  it('handles NewLiquidationIncentive event', async function () {
    const poolsQuery = await queryPools();
    const response = (await subgraph({ query: poolsQuery })) as FetchResult;
    const { pools } = response.data;
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
    const poolsQuery = await queryPools();
    const response = (await subgraph({ query: poolsQuery })) as FetchResult;
    const { pools } = response.data;
    // @TODO this event is fired from deployment
    // Could test by refiring event
    pools.forEach(p => {
      expect(p.minLiquidatableCollateral).to.equal(0);
    });
  });
});
