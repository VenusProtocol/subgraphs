import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { scaleValue, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';
import { defaultMarkets } from './constants';

describe('Pools', function () {
  let acc1: Signer;
  let root: SignerWithAddress;
  let accessControlManager: Contract;

  const syncDelay = 6000;

  before(async function () {
    const signers = await ethers.getSigners();
    [root] = await ethers.getSigners();
    acc1 = signers[1];

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
    await waitForSubgraphToBeSynced(syncDelay);
  });

  it('handles MarketAdded event', async function () {
    // check markets
    const { data: marketsData } = await subgraphClient.getMarkets();
    const { markets } = marketsData!;

    expect(markets.length).to.equal(9);

    markets.forEach(async m => {
      const defaultMarket = defaultMarkets.find(dm => m.id === dm.id.toLowerCase());
      const vToken = await ethers.getContractAt('VTokenImpl', m.id);

      expect(m.pool.id).to.equal(defaultMarket?.pool.id.toLowerCase());
      expect(m.borrowRateMantissa).to.equal(defaultMarket?.borrowRateMantissa);
      expect(m.cashMantissa).to.equal(defaultMarket?.cashMantissa);
      expect(m.collateralFactorMantissa).to.equal(defaultMarket?.collateralFactorMantissa);
      expect(m.exchangeRateMantissa).to.equal(defaultMarket?.exchangeRateMantissa);
      expect(m.interestRateModelAddress).to.equal(
        defaultMarket?.interestRateModelAddress.toLowerCase(),
      );
      expect(m.name).to.equal(defaultMarket?.name);
      expect(m.reservesMantissa).to.equal(defaultMarket?.reservesMantissa);
      expect(m.supplyRateMantissa).to.equal(defaultMarket?.supplyRateMantissa);
      expect(m.symbol).to.equal(defaultMarket?.symbol);
      expect(m.underlyingAddress).to.equal(defaultMarket?.underlyingAddress.toLowerCase());
      expect(m.underlyingName).to.equal(defaultMarket?.underlyingName);
      expect(m.underlyingSymbol).to.equal(defaultMarket?.underlyingSymbol);
      expect(m.borrowCapMantissa).to.equal(defaultMarket?.borrowCapMantissa);
      expect(m.supplyCapMantissa).to.equal(defaultMarket?.supplyCapMantissa);
      expect(m.accrualBlockNumber).to.equal(defaultMarket?.accrualBlockNumber);
      expect(m.blockTimestamp).to.not.be.equal(defaultMarket?.blockTimestamp);
      expect(m.borrowIndexMantissa).to.equal((await vToken.borrowIndex()).toString());
      expect(m.reserveFactorMantissa).to.equal(defaultMarket?.reserveFactorMantissa);
      expect(m.underlyingPriceCentsMantissa).to.equal(defaultMarket?.underlyingPriceCentsMantissa);
      expect(m.underlyingDecimals).to.equal(defaultMarket?.underlyingDecimals);
      expect(m.supplierCount).to.equal(defaultMarket?.supplierCount);
      expect(m.borrowerCount).to.equal(defaultMarket?.borrowerCount);
    });
  });

  it('handles MarketEntered and MarketExited events', async function () {
    const account1Address = await acc1.getAddress();
    await waitForSubgraphToBeSynced(syncDelay);

    // check account
    const { data } = await subgraphClient.getAccountById(account1Address.toLowerCase());
    const { account } = data!;
    expect(account?.id).to.equal(account1Address.toLowerCase());
    expect(account?.pools.length).to.equal(1);
    expect(account?.countLiquidated).to.equal(0);
    expect(account?.countLiquidator).to.equal(0);
    expect(account?.hasBorrowed).to.equal(false);

    // check accountVTokens
    const { data: accountVTokensData } = await subgraphClient.getAccountVTokensByAccountId(
      account1Address.toLowerCase(),
    );
    expect(accountVTokensData).to.not.be.equal(undefined);
    const { accountVTokens } = accountVTokensData!;

    accountVTokens.forEach((avt, idx) => {
      expect(avt.id).to.equal(account?.pools[0].tokens[idx].id);
      const expectedMarketId = account?.pools[0].tokens[idx].id.slice(0, 42);
      expect(avt.market.id).to.equal(expectedMarketId);
      expect(avt.account.id).to.equal(account?.id);

      expect(avt.enteredMarket).to.equal(true);
      expect(avt.accountVTokenSupplyBalanceMantissa).to.equal('0');
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

    const tx = await comptrollerProxy.setCloseFactor('600000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getPools();
    const { pools } = data!;

    expect(pools[0].closeFactorMantissa).to.equal('600000000000000000');
  });

  it('handles NewCollateralFactor event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarkets();
    const { markets: marketsBeforeEvent } = dataBeforeEvent!;
    const market = marketsBeforeEvent[1];
    const poolLens = await ethers.getContract('PoolLens');
    const vTokenMetadata = await poolLens.vTokenMetadata(market.id);
    expect(market.collateralFactorMantissa).to.equal(
      vTokenMetadata.collateralFactorMantissa.toString(),
    );

    const comptrollerProxy = await ethers.getContractAt('Comptroller', market.pool.id);

    const tx = await comptrollerProxy.setCollateralFactor(
      marketsBeforeEvent[1].id,
      scaleValue(0.00006).toString(), // collateral factor
      scaleValue(0.00009).toString(), // liquidation threshold
    );
    await tx.wait(1);
    await waitForSubgraphToBeSynced(4000);

    const { data } = await subgraphClient.getMarketById(market.id);
    const { market: marketNew } = data!;

    expect(marketNew?.collateralFactorMantissa).to.equal('60000000000000');
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

    const poolLens = await ethers.getContract('PoolLens');
    let vTokenMetadata = await poolLens.vTokenMetadata(marketsBeforeUpdate[0].id);
    expect(marketsBeforeUpdate[0].borrowCapMantissa).to.equal(vTokenMetadata.borrowCaps.toString());

    const comptrollerProxy = await ethers.getContractAt(
      'Comptroller',
      marketsBeforeUpdate[0].pool.id,
    );

    const tx = await comptrollerProxy.setMarketBorrowCaps([marketsBeforeUpdate[0].id], ['0']);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: marketsData } = await subgraphClient.getMarkets();
    const { markets } = marketsData!;

    vTokenMetadata = await poolLens.vTokenMetadata(marketsBeforeUpdate[0].id);
    expect(markets[0].borrowCapMantissa).to.equal(vTokenMetadata.borrowCaps.toString());
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

    const poolLens = await ethers.getContract('PoolLens');
    let vTokenMetadata = await poolLens.vTokenMetadata(marketsBeforeUpdate[0].id);
    expect(marketsBeforeUpdate[0].supplyCapMantissa).to.equal(vTokenMetadata.supplyCaps.toString());

    const comptrollerProxy = await ethers.getContractAt(
      'Comptroller',
      marketsBeforeUpdate[0].pool.id,
    );

    const tx = await comptrollerProxy.setMarketSupplyCaps(
      [marketsBeforeUpdate[0].id],
      ['100000000000000000000000'],
    );
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: marketsData } = await subgraphClient.getMarkets();
    const { markets } = marketsData!;

    vTokenMetadata = await poolLens.vTokenMetadata(marketsBeforeUpdate[0].id);
    expect(markets[0].supplyCapMantissa).to.equal(vTokenMetadata.supplyCaps.toString());
  });
});
