import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { scaleValue, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';
import { defaultMarkets } from './constants';
import deploy from './utils/deploy';

describe('Pools', function () {
  let acc1: Signer;
  let root: SignerWithAddress;
  let accessControlManager: Contract;

  const syncDelay = 3000;

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

    tx = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setCloseFactor(uint256)',
      root.address,
    );
    tx.wait();
    const { data: marketsData } = await subgraphClient.getMarkets();
    const { markets } = marketsData!;
    markets.forEach(async m => {
      const comptrollerProxy = await ethers.getContractAt('Comptroller', m.pool.id);
      comptrollerProxy.supportMarket(m.id);
    });
  });

  it('handles MarketAdded event', async function () {
    // check markets
    const { data: marketsData } = await subgraphClient.getMarkets();
    const { markets } = marketsData!;
    expect(markets.length).to.equal(9);

    markets.forEach((m, idx) => {
      const defaultMarket = defaultMarkets[idx];
      expect(m.pool.id).to.equal(defaultMarket.pool.id);
      expect(m.borrowRateMantissa).to.equal(defaultMarket.borrowRateMantissa);
      expect(m.cashMantissa).to.equal(defaultMarket.cashMantissa);
      expect(m.collateralFactorMantissa).to.equal(defaultMarket.collateralFactorMantissa);
      expect(m.exchangeRateMantissa).to.equal(defaultMarket.exchangeRateMantissa);
      expect(m.interestRateModelAddress).to.equal(defaultMarket.interestRateModelAddress);
      expect(m.name).to.equal(defaultMarket.name);
      expect(m.reservesMantissa).to.equal(defaultMarket.reservesMantissa);
      expect(m.supplyRateMantissa).to.equal(defaultMarket.supplyRateMantissa);
      expect(m.symbol).to.equal(defaultMarket.symbol);
      expect(m.underlyingAddress).to.equal(defaultMarket.underlyingAddress);
      expect(m.underlyingName).to.equal(defaultMarket.underlyingName);
      expect(m.underlyingSymbol).to.equal(defaultMarket.underlyingSymbol);
      expect(m.borrowCapMantissa).to.equal(defaultMarket.borrowCapMantissa);
      expect(m.supplyCapMantissa).to.equal(defaultMarket.supplyCapMantissa);
      expect(m.accrualBlockNumber).to.equal(defaultMarket.accrualBlockNumber);
      expect(m.blockTimestamp).to.not.be.equal(defaultMarket.blockTimestamp);
      expect(m.borrowIndexMantissa).to.equal(defaultMarket.borrowIndexMantissa);
      expect(m.reserveFactorMantissa).to.equal(defaultMarket.reserveFactorMantissa);
      expect(m.underlyingPriceCents).to.equal(defaultMarket.underlyingPriceCents);
      expect(m.underlyingDecimals).to.equal(defaultMarket.underlyingDecimals);
      expect(m.supplierCount).to.equal(defaultMarket.supplierCount);
      expect(m.borrowerCount).to.equal(defaultMarket.borrowerCount);
    });
  });

  it('handles MarketEntered and MarketExited events', async function () {
    const account1Address = await acc1.getAddress();
    await waitForSubgraphToBeSynced(syncDelay * 2);

    // check account
    const { data } = await subgraphClient.getAccountById(account1Address.toLowerCase());
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
    const { pools: poolsBeforeUpdate } = dataBeforeUpdate!;

    expect(poolsBeforeUpdate[0].closeFactorMantissa).to.equal('50000000000000000');

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeUpdate[0].id);

    const tx = await comptrollerProxy.setCloseFactor('500000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    const { pools } = data!;

    expect(pools[0].closeFactorMantissa).to.equal('500000000000000000');
  });

  it('handles NewCollateralFactor event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarkets();
    const { markets: marketsBeforeEvent } = dataBeforeEvent!;
    const market = marketsBeforeEvent[1];
    expect(market.collateralFactorMantissa).to.equal('600000000000000000');

    const comptrollerProxy = await ethers.getContractAt('Comptroller', market.pool.id);

    const tx = await comptrollerProxy.setCollateralFactor(
      marketsBeforeEvent[1].id,
      scaleValue(0.00007).toString(), // collateral factor
      scaleValue(0.00009).toString(), // liquidation threshold
    );
    await tx.wait(1);
    await waitForSubgraphToBeSynced(4000);

    const { data } = await subgraphClient.getMarketById(market.id);
    const { market: marketNew } = data!;

    expect(marketNew?.collateralFactorMantissa).to.equal('70000000000000');
    expect(marketNew?.liquidationThresholdMantissa).to.equal('90000000000000');
  });

  it('handles NewLiquidationIncentive event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getPools();
    const { pools: poolsBeforeEvent } = dataBeforeEvent!;

    expect(poolsBeforeEvent[0].liquidationIncentiveMantissa).to.equal('1000000000000000000');

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeEvent[0].id);

    const tx = await comptrollerProxy.setLiquidationIncentive('3000000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    const { pools } = data!;

    expect(pools[0].liquidationIncentiveMantissa).to.equal('3000000000000000000');
  });

  it('handles NewPriceOracle event', async function () {
    const newPriceOracle = '0x0000000000000000000000000000000000000123';
    const { data } = await subgraphClient.getPools();
    const { pools } = data!;

    const priceOracle = await ethers.getContract('ResilientOracle');

    expect(pools[0].priceOracleAddress).to.equal(priceOracle.address.toLowerCase());

    const comptrollerProxy = await ethers.getContractAt('Comptroller', pools[0].id);

    const tx = await comptrollerProxy.setPriceOracle(newPriceOracle);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: updatedPoolData } = await subgraphClient.getPools();

    const { pools: updatedPools } = updatedPoolData!;
    expect(updatedPools[0].priceOracleAddress).to.equal(newPriceOracle);
    // Reset oracle address
    await comptrollerProxy.setPriceOracle(priceOracle.address);
  });

  it('handles ActionPausedMarket event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketActions();
    const { marketActions: marketActionsBeforeEvent } = dataBeforeEvent!;

    expect(marketActionsBeforeEvent.length).to.be.equal(0);

    const { data: marketsData } = await subgraphClient.getMarkets();
    const { markets } = marketsData!;
    const market = markets[1];
    const comptrollerProxy = await ethers.getContractAt('Comptroller', market.pool.id);

    const tx = await comptrollerProxy.setActionsPaused([market.id], [1], true);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(4000);

    const { data } = await subgraphClient.getMarketActions();
    const { marketActions } = data!;

    expect(marketActions.length).to.be.equal(1);
    marketActions.forEach(ma => {
      expect(ma.vToken).to.be.equal(markets[1].id);
      expect(ma.action).to.be.equal('REDEEM');
      expect(ma.pauseState).to.be.equal(true);
    });
    // Enable again
    await comptrollerProxy.setActionsPaused([market.id], [1], false);
  });

  it('handles NewBorrowCap event', async function () {
    const { data } = await subgraphClient.getMarkets();
    const { markets: marketsBeforeUpdate } = data!;

    expect(marketsBeforeUpdate[0].borrowCapMantissa).to.equal('3000000000000000000000000');

    const comptrollerProxy = await ethers.getContractAt(
      'Comptroller',
      marketsBeforeUpdate[0].pool.id,
    );

    const tx = await comptrollerProxy.setMarketBorrowCaps([marketsBeforeUpdate[0].id], ['0']);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: marketsData } = await subgraphClient.getMarkets();
    const { markets } = marketsData!;
    expect(markets[0].borrowCapMantissa).to.equal('0');
  });

  it('handles NewMinLiquidatableCollateral event', async function () {
    const { data: dataBeforeUpdate } = await subgraphClient.getPools();
    const { pools: poolsBeforeUpdate } = dataBeforeUpdate!;

    expect(poolsBeforeUpdate[0].minLiquidatableCollateralMantissa).to.equal(
      '100000000000000000000',
    );

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeUpdate[0].id);

    const tx = await comptrollerProxy.setMinLiquidatableCollateral('200000000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    const { pools } = data!;

    expect(pools[0].minLiquidatableCollateralMantissa).to.equal('200000000000000000000');
  });

  it('handles NewSupplyCap event', async function () {
    const { data } = await subgraphClient.getMarkets();
    const { markets: marketsBeforeUpdate } = data!;

    expect(marketsBeforeUpdate[0].supplyCapMantissa).to.equal('3000000000000000000000000');

    const comptrollerProxy = await ethers.getContractAt(
      'Comptroller',
      marketsBeforeUpdate[0].pool.id,
    );

    const tx = await comptrollerProxy.setMarketSupplyCaps(
      [marketsBeforeUpdate[0].id],
      ['100000000000000000'],
    );
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: marketsData } = await subgraphClient.getMarkets();
    const { markets } = marketsData!;
    expect(markets[0].supplyCapMantissa).to.equal('100000000000000000');
  });
});
