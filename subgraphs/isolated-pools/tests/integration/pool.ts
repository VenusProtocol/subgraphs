import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { normalizeMantissa, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

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
    '0x5fbdb2315678afecb367f032d93f642f64180aa3',
    '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512',
  ];
  const underlyingSymbols = ['BSW', 'BNX'];
  const underlyingPricesUSD = ['0.208', '159.99'];
  const interestRateModelAddresses = [
    '0xbf5a316f4303e13ae92c56d2d8c9f7629bef5c6e',
    '0xb955b6c65ff69bfe07a557aa385055282b8a5ea3',
  ];
  const priceOracleAddress = '0xa513e6e4b8f2a923d98304ec87f64353c4d5c853';
  const accrualBlockNumbers = [82, 79];

  const vTokens: Array<string> = [];
  const actions: Array<number> = [];

  const maxCap = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

  before(async function () {
    this.timeout(500000); // sometimes it takes a long time
    const signers = await ethers.getSigners();
    [root] = await ethers.getSigners();
    acc1 = signers[1];
    await deploy();

    accessControlManager = await ethers.getContract('AccessControlManager');

    let tx = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setMinLiquidatableCollateral(uint256)',
      root.address,
    );
    await tx.wait();

    tx = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setActionsPaused(address[],uint256[],bool)',
      root.address,
    );
    tx.wait();

    tx = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setCollateralFactor(address,uint256,uint256)',
      root.address,
    );
    tx.wait();

    tx = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setLiquidationIncentive(uint256)',
      root.address,
    );
    tx.wait();

    tx = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setMarketBorrowCaps(address[],uint256[])',
      root.address,
    );
    tx.wait();

    tx = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setMarketSupplyCaps(address[],uint256[])',
      root.address,
    );
    tx.wait();

    const { data: marketsData } = await subgraphClient.getMarkets();
    const { markets } = marketsData!;

    markets.forEach(m => {
      vTokens.push(m.id);
      actions.push(1); // 1 is the REDEEM action
    });
  });

  after(async function () {
    // reverting changes made inside tests
    const { data: marketsData } = await subgraphClient.getMarkets();
    const { markets } = marketsData!;

    const comptrollerProxy = await ethers.getContractAt('Comptroller', markets[0].pool.id);

    // reset price oracle
    await comptrollerProxy.setPriceOracle(priceOracleAddress);

    // unpause actions
    await comptrollerProxy.connect(root).setActionsPaused(vTokens, actions, false);

    // reset supply cap
    let tx = await comptrollerProxy.setMarketSupplyCaps(vTokens, [maxCap, maxCap]);
    tx.wait(1);

    // reset borrow cap
    tx = await comptrollerProxy.connect(root).setMarketBorrowCaps(vTokens, [maxCap, maxCap]);
    tx.wait(1);

    waitForSubgraphToBeSynced(syncDelay);
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
      expect(m.borrowRateMantissa).to.equal('0');
      expect(m.cash).to.equal('1');
      expect(m.collateralFactorMantissa).to.equal('700000000000000000');
      expect(m.exchangeRateMantissa).to.equal('10000000000000000000000000000');
      expect(m.interestRateModelAddress).to.equal(interestRateModelAddresses[idx]);
      expect(m.name).to.equal(marketNames[idx]);
      expect(m.reservesMantissa).to.equal('0');
      expect(m.supplyRateMantissa).to.equal('0');
      expect(m.symbol).to.equal(symbols[idx]);
      expect(m.underlyingAddress).to.equal(underlyingAddresses[idx]);
      expect(m.underlyingName).to.equal(underlyingNames[idx]);
      expect(m.underlyingSymbol).to.equal(underlyingSymbols[idx]);
      expect(m.borrowCapMantissa).to.equal('10000000000000000000000');
      expect(m.supplyCapMantissa).to.equal('10000000000000000000000');
      expect(m.accrualBlockNumber).to.equal(accrualBlockNumbers[idx]);
      expect(m.blockTimestamp).to.not.be.equal('0');
      expect(m.borrowIndexMantissa).to.equal('1000000000000000000');
      expect(m.reserveFactorMantissa).to.equal('0');
      expect(m.underlyingPriceUsd).to.equal(underlyingPricesUSD[idx]);
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
    const { data: accountVTokensData } = await subgraphClient.getAccountVTokensByAccountId(
      account1Address.toLowerCase(),
    );
    expect(accountVTokensData).to.not.be.equal(undefined);
    const { accountVTokens } = accountVTokensData!;

    accountVTokens.forEach((avt, idx) => {
      expect(avt.id).to.equal(account?.tokens[idx].id);
      const expectedMarketId = account?.tokens[idx].id.split('-')[0];
      expect(avt.market.id).to.equal(expectedMarketId);
      expect(avt.symbol).to.equal(symbols[idx]);
      expect(avt.account.id).to.equal(account?.id);
      // check accountVTokenTransaction
      expect(avt.transactions.length).to.equal(1);
      expect(avt.transactions[0].block).to.not.be.equal(0);
      expect(avt.transactions[0].timestamp).to.not.be.equal(0);

      expect(avt.enteredMarket).to.equal(true);
      expect(avt.accountSupplyBalanceMantissa).to.equal('0');
      expect(avt.totalUnderlyingRedeemedMantissa).to.equal('0');
      expect(avt.accountBorrowIndexMantissa).to.equal('0');
      expect(avt.totalUnderlyingRepaidMantissa).to.equal('0');
      expect(avt.accountBorrowBalanceMantissa).to.equal('0');
    });
  });

  it('handles NewCloseFactor event', async function () {
    const { data: dataBeforeUpdate } = await subgraphClient.getPools();
    expect(dataBeforeUpdate).to.not.be.equal(undefined);
    const { pools: poolsBeforeUpdate } = dataBeforeUpdate!;

    poolsBeforeUpdate.forEach(p => {
      expect(p.closeFactorMantissa).to.equal('50000000000000000');
    });

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeUpdate[0].id);

    const tx = await comptrollerProxy.setCloseFactor('10000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;

    pools.forEach(p => {
      expect(p.closeFactorMantissa).to.equal('10000000000000000');
    });
  });

  it('handles NewCollateralFactor event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets: marketsBeforeEvent } = dataBeforeEvent!;

    marketsBeforeEvent.forEach(m => {
      expect(m.collateralFactorMantissa).to.equal('700000000000000000');
    });

    const eventPromises = marketsBeforeEvent.map(async m => {
      const comptrollerProxy = await ethers.getContractAt('Comptroller', m.pool.id);
      const tx = await comptrollerProxy
        .connect(root)
        .setCollateralFactor(
          m.id,
          normalizeMantissa(0.1).toFixed(),
          normalizeMantissa(0.01).toFixed(),
        );
      await tx.wait(1);
      await waitForSubgraphToBeSynced(syncDelay);
    });
    await Promise.all(eventPromises);

    const { data } = await subgraphClient.getMarkets();
    expect(data).to.not.be.equal(undefined);
    const { markets } = data!;

    markets.forEach(m => {
      expect(m.collateralFactorMantissa).to.equal('100000000000000000');
    });
  });

  it('handles NewLiquidationIncentive event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getPools();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { pools: poolsBeforeEvent } = dataBeforeEvent!;

    poolsBeforeEvent.forEach(p => {
      expect(p.liquidationIncentiveMantissa).to.equal('1000000000000000000');
    });

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeEvent[0].id);

    const tx = await comptrollerProxy.connect(root).setLiquidationIncentive('2000000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;

    expect(pools[0].liquidationIncentiveMantissa).to.equal('2000000000000000000');
  });

  it('handles NewPriceOracle event', async function () {
    const newPriceOracle = '0x0000000000000000000000000000000000000123';
    const { data } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools } = data!;

    pools.forEach(p => {
      expect(p.priceOracleAddress).to.equal(priceOracleAddress);
    });

    const comptrollerProxy = await ethers.getContractAt('Comptroller', pools[0].id);

    const tx = await comptrollerProxy.setPriceOracle(newPriceOracle);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: updatedPoolData } = await subgraphClient.getPools();
    expect(data).to.not.be.equal(undefined);
    const { pools: updatedPools } = updatedPoolData!;

    updatedPools.forEach(p => {
      expect(p.priceOracleAddress).to.equal(newPriceOracle);
    });
  });

  it('handles MarketActionPaused event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketActions();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { marketActions: marketActionsBeforeEvent } = dataBeforeEvent!;

    expect(marketActionsBeforeEvent.length).to.be.equal(0);

    const { data: marketsData } = await subgraphClient.getMarkets();
    expect(marketsData).to.not.be.equal(undefined);
    const { markets } = marketsData!;

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
      expect(ma.action).to.be.equal('REDEEM');
      expect(ma.pauseState).to.be.equal(true);
    });
  });

  it('handles NewBorrowCap event', async function () {
    const { data } = await subgraphClient.getMarkets();
    expect(data).to.not.be.equal(undefined);
    const { markets: marketsBeforeUpdate } = data!;

    marketsBeforeUpdate.forEach(m => {
      expect(m.borrowCapMantissa).to.equal('10000000000000000000000');
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

    const tx = await comptrollerProxy.connect(root).setMarketBorrowCaps(vTokens, borrowCaps);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: marketsData } = await subgraphClient.getMarkets();
    expect(marketsData).to.not.be.equal(undefined);
    const { markets } = marketsData!;
    markets.forEach(m => {
      expect(m.borrowCapMantissa).to.equal('0');
    });
  });

  it('handles NewMinLiquidatableCollateral event', async function () {
    const { data: dataBeforeUpdate } = await subgraphClient.getPools();
    expect(dataBeforeUpdate).to.not.be.equal(undefined);
    const { pools: poolsBeforeUpdate } = dataBeforeUpdate!;

    poolsBeforeUpdate.forEach(p => {
      expect(p.minLiquidatableCollateralMantissa).to.equal('100000000000000000000');
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
      expect(p.minLiquidatableCollateralMantissa).to.equal('200000000000000000000');
    });
  });

  it('handles NewSupplyCap event', async function () {
    const { data } = await subgraphClient.getMarkets();
    expect(data).to.not.be.equal(undefined);
    const { markets: marketsBeforeUpdate } = data!;

    marketsBeforeUpdate.forEach(m => {
      expect(m.supplyCapMantissa).to.equal('10000000000000000000000');
    });

    const vTokens: Array<string> = [];
    const supplyCaps: Array<string> = [];
    marketsBeforeUpdate.forEach(m => {
      vTokens.push(m.id);
      supplyCaps.push('100');
    });

    const comptrollerProxy = await ethers.getContractAt(
      'Comptroller',
      marketsBeforeUpdate[0].pool.id,
    );

    const tx = await comptrollerProxy.connect(root).setMarketSupplyCaps(vTokens, supplyCaps);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: marketsData } = await subgraphClient.getMarkets();
    expect(marketsData).to.not.be.equal(undefined);
    const { markets } = marketsData!;
    markets.forEach(m => {
      expect(m.supplyCapMantissa).to.equal('100');
    });
  });
});
