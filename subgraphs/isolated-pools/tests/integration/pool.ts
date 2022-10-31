import { ApolloFetch, FetchResult } from 'apollo-fetch';
import { exec, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Pool } from '../../generated/schema';

import { queryPools, queryMarkets, queryAccountVTokens, queryAccountVTokenTransactions, queryAccounts } from './queries';
import deploy from './utils/deploy';
import { Signer } from 'ethers';

describe('Pools', function () {
  let subgraph: ApolloFetch;
  let deployer: Signer
  let acc1: Signer;
  let pools: Array<Pool> = [];

  const syncDelay = 2000;

  before(async function () {
    ([deployer, acc1] = await ethers.getSigners());
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
    const pool1Comptroller = await ethers.getContractAt('Comptroller', pools[0].id)
    await pool1Comptroller.connect(acc1).callStatic.enterMarkets(['0x8acd85898458400f7db866d53fcff6f0d49741ff']);

    await waitForSubgraphToBeSynced(syncDelay);
    // check accounts
    const accountsQuery = await queryAccounts();
    let response = (await subgraph({ query: accountsQuery })) as FetchResult;
    console.log({ response })
    // check accountVTokens
    const accountVTokensQuery = await queryAccountVTokens();
    response = (await subgraph({ query: accountVTokensQuery })) as FetchResult;
    console.log({ response })
    // check accountVTokenTransaction
    const accountVTokenTransactionsQuery = await queryAccountVTokenTransactions();
    response = (await subgraph({ query: accountVTokenTransactionsQuery })) as FetchResult;
    console.log({ response })
  });
});
