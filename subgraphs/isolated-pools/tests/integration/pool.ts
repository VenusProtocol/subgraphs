import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { exec, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';
import deploy from './utils/deploy';

describe('Pools', function () {
  let acc1: Signer;
  let root: SignerWithAddress;
  let accessControlManager: Contract;

  const syncDelay = 3000;

  const symbols = ['vBSW', 'vBNX'];
  const marketNames = ['Venus BSW', 'Venus BNX'];
  const underlyingNames = ['Biswap', 'BinaryX'];
  const underlyingAddresses = [
    '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512',
    '0x5fbdb2315678afecb367f032d93f642f64180aa3',
  ];
  const underlyingSymbols = ['BSW', 'BNX'];
  const interestRateModelAddresses = [
    '0xb267c5f8279a939062a20d29ca9b185b61380f10',
    '0xe73bc5bd4763a3307ab5f8f126634b7e12e3da9b',
  ];
  const priceOracle = '0x0165878a594ca255338adfa4d48449f69242eb8f';

  before(async function () {
    this.timeout(500000); // sometimes it takes a long time
    const signers = await ethers.getSigners();
    [root] = await ethers.getSigners();
    acc1 = signers[1];
    await deploy();

    accessControlManager = await ethers.getContract('AccessControlManager');

    const tx1 = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setMinLiquidatableCollateral(uint256)',
      root.address,
    );
    await tx1.wait();

    const tx2 = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setActionsPaused(address[],uint256[],bool)',
      root.address,
    );
    await tx2.wait();

    const tx3 = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setCollateralFactor(address,uint256,uint256)',
      root.address,
    );
    await tx3.wait();
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

    markets.forEach((m, idx) => {
      expect(m.pool.id).to.equal(pool.id);
      expect(m.borrowRate).to.equal('0');
      expect(m.cash).to.equal('0');
      expect(m.collateralFactor).to.equal('0');
      expect(m.exchangeRate).to.equal('0');
      expect(m.interestRateModelAddress).to.equal(interestRateModelAddresses[idx]);
      expect(m.name).to.equal(marketNames[idx]);
      expect(m.reserves).to.equal('0');
      expect(m.supplyRate).to.equal('0');
      expect(m.symbol).to.equal(symbols[idx]);
      expect(m.underlyingAddress).to.equal(underlyingAddresses[idx]);
      expect(m.underlyingName).to.equal(underlyingNames[idx]);
      expect(m.underlyingPrice).to.equal('0');
      expect(m.underlyingSymbol).to.equal(underlyingSymbols[idx]);
      expect(m.borrowCap).to.equal(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      );
      expect(m.accrualBlockNumber).to.equal(0);
      expect(m.blockTimestamp).to.equal(0);
      expect(m.borrowIndex).to.equal('0');
      expect(m.reserveFactor).to.equal('0');
      expect(m.underlyingPriceUsd).to.equal('0');
      expect(m.underlyingDecimals).to.equal(18);
    });
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

    accountVTokens.forEach((avt, idx) => {
      expect(avt.id).to.equal(account?.tokens[idx].id);
      const expectedMarketId = account?.tokens[idx].id.split('-')[0];
      expect(avt.market.id).to.equal(expectedMarketId);
      expect(avt.symbol).to.equal(symbols[idx]);
      expect(avt.account.id).to.equal(account?.id);
      expect(avt.transactions.length).to.equal(0);
      expect(avt.enteredMarket).to.equal(true);
      expect(avt.vTokenBalance).to.equal('0');
      expect(avt.totalUnderlyingRedeemed).to.equal('0');
      expect(avt.accountBorrowIndex).to.equal('0');
      expect(avt.totalUnderlyingRepaid).to.equal('0');
      expect(avt.storedBorrowBalance).to.equal('0');
    });

    // check accountVTokenTransaction
    const { data: accountVTokensTransactionData } =
      await subgraphClient.getAccountVTokensTransactions();
    expect(accountVTokensTransactionData).to.not.be.equal(undefined);
    const { accountVTokenTransactions } = accountVTokensTransactionData!;
    expect(accountVTokenTransactions.length).to.be.equal(2);

    const expectedVTokenTransactionHash =
      '0xf8f4db1ac7dcf72642f685fdc7904e99930ab16d7d4623b3cecb3b07dc74a093';
    accountVTokenTransactions.forEach((avtt, idx) => {
      const expectedAccountVTokenTransactionsId = `${account?.id}-${expectedVTokenTransactionHash}-${idx}`;
      expect(avtt.id).to.equal(expectedAccountVTokenTransactionsId);
    });
  });

  it('handles NewCloseFactor event', async function () {
    const { data: dataBeforeUpdate } = await subgraphClient.getPools();
    expect(dataBeforeUpdate).to.not.be.equal(undefined);
    const { pools: poolsBeforeUpdate } = dataBeforeUpdate!;

    poolsBeforeUpdate.forEach(p => {
      expect(p.closeFactor).to.equal('50000000000000000');
    });

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeUpdate[0].id);

    const tx = await comptrollerProxy.setCloseFactor('10000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;

    pools.forEach(p => {
      expect(p.closeFactor).to.equal('10000000000000000');
    });
  });

  it('handles NewCollateralFactor event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets: marketsBeforeEvent } = dataBeforeEvent!;

    marketsBeforeEvent.forEach(m => {
      expect(m.collateralFactor).to.equal('0');
    });

    const eventPromises = marketsBeforeEvent.map(async m => {
      const comptrollerProxy = await ethers.getContractAt('Comptroller', m.pool.id);
      const tx = await comptrollerProxy
        .connect(root)
        .setCollateralFactor(m.pool.id, '1000000000000000000', '0');
      await tx.wait(1);
      await waitForSubgraphToBeSynced(syncDelay);
    });
    await Promise.all(eventPromises);

    const { data } = await subgraphClient.getMarkets();
    expect(data).to.not.be.equal(undefined);
    const { markets } = data!;

    markets.forEach(m => {
      expect(m.collateralFactor).to.equal('1');
    });
  });

  it('handles NewLiquidationIncentive event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getPools();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { pools: poolsBeforeEvent } = dataBeforeEvent!;

    poolsBeforeEvent.forEach(p => {
      expect(p.liquidationIncentive).to.equal('1000000000000000000');
    });

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeEvent[0].id);

    const tx = await comptrollerProxy.setLiquidationIncentive('2000000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;

    pools.forEach(p => {
      expect(p.liquidationIncentive).to.equal('2000000000000000000');
    });
  });

  it('handles NewPriceOracle event', async function () {
    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;

    pools.forEach(p => {
      expect(p.priceOracle).to.equal(priceOracle);
    });

    const comptrollerProxy = await ethers.getContractAt('Comptroller', pools[0].id);

    const tx = await comptrollerProxy.setPriceOracle('0x0000000000000000000000000000000000000123');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: updatedPoolData } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools: updatedPools } = updatedPoolData!;

    updatedPools.forEach(p => {
      expect(p.priceOracle).to.equal('0x0000000000000000000000000000000000000123');
    });
  });

  it('handles PoolActionPaused event', async function () {
    // @TODO
  });

  it('handles MarketActionPaused event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketActions();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { marketActions: marketActionsBeforeEvent } = dataBeforeEvent!;

    expect(marketActionsBeforeEvent.length).to.be.equal(0);

    const { data: marketsData } = await subgraphClient.getMarkets();
    expect(marketsData).to.not.be.equal(undefined);
    const { markets } = marketsData!;

    const vTokens: Array<string> = [];
    const actions: Array<number> = [];
    markets.forEach(m => {
      vTokens.push(m.id);
      actions.push(0);
    });

    const comptrollerProxy = await ethers.getContractAt('Comptroller', markets[0].pool.id);

    const tx = await comptrollerProxy.connect(root).setActionsPaused(vTokens, actions, true);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketActions();
    expect(data).to.not.be.equal(undefined);
    const { marketActions } = data!;

    expect(marketActions.length).to.be.equal(vTokens.length);
    marketActions.forEach((ma, idx) => {
      expect(ma.vToken).to.be.equal(vTokens[idx]);
      expect(ma.action).to.be.equal(0);
      expect(ma.pauseState).to.be.equal(true);
    });
  });

  it('handles NewBorrowCap event', async function () {
    const { data } = await subgraphClient.getMarkets();
    expect(data).to.not.be.equal(undefined);
    const { markets: marketsBeforeUpdate } = data!;

    marketsBeforeUpdate.forEach(m => {
      expect(m.borrowCap).to.equal(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      );
    });

    const vTokens: Array<string> = [];
    const borrowCaps: Array<string> = [];
    marketsBeforeUpdate.forEach(m => {
      vTokens.push(m.id);
      borrowCaps.push('0');
    });

    const comptrollerProxy = await ethers.getContractAt(
      'Comptroller',
      marketsBeforeUpdate[0].pool.id,
    );

    const tx = await comptrollerProxy.setMarketBorrowCaps(vTokens, borrowCaps);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: marketsData } = await subgraphClient.getMarkets();
    expect(marketsData).to.not.be.equal(undefined);
    const { markets } = marketsData!;
    markets.forEach(m => {
      expect(m.borrowCap).to.equal('0');
    });
  });

  it('handles NewMinLiquidatableCollateral event', async function () {
    const { data: dataBeforeUpdate } = await subgraphClient.getPools();
    expect(dataBeforeUpdate).to.not.be.equal(undefined);
    const { pools: poolsBeforeUpdate } = dataBeforeUpdate!;

    poolsBeforeUpdate.forEach(p => {
      expect(p.minLiquidatableCollateral).to.equal('100000000000000000000');
    });

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeUpdate[0].id);

    const tx = await comptrollerProxy
      .connect(root)
      .setMinLiquidatableCollateral('200000000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;

    pools.forEach(p => {
      expect(p.minLiquidatableCollateral).to.equal('200000000000000000000');
    });
  });
});
