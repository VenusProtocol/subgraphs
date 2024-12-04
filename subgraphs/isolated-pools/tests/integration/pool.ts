import { scaleValue, waitForSubgraphToBeSynced } from '@venusprotocol/subgraph-utils';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import createSubgraphClient from '../../subgraph-client';
import { checkMarket } from './checkEntities';

const subgraphClient = createSubgraphClient(
  'http://graph-node:8000/subgraphs/name/venusprotocol/venus-isolated-pools',
);

describe('Pools', function () {
  const syncDelay = 6000;

  before(async function () {
    await waitForSubgraphToBeSynced(syncDelay);
  });

  it('handles MarketAdded event', async function () {
    // check markets
    const { markets } = await subgraphClient.getMarkets();

    expect(markets.length).to.equal(9);

    markets.forEach(async m => {
      await checkMarket(m.id);
    });
  });

  it('handles NewCloseFactor event', async function () {
    const { pools: poolsBeforeUpdate } = await subgraphClient.getPools();

    expect(poolsBeforeUpdate[0].closeFactorMantissa).to.equal('50000000000000000');

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeUpdate[0].id);

    const tx = await comptrollerProxy.setCloseFactor('600000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { pools } = await subgraphClient.getPools();

    expect(pools[0].closeFactorMantissa).to.equal('600000000000000000');
  });

  it('handles NewCollateralFactor event', async function () {
    const { markets: marketsBeforeEvent } = await subgraphClient.getMarkets();
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

    const { market: marketNew } = await subgraphClient.getMarketById(market.id);

    expect(marketNew?.collateralFactorMantissa).to.equal('60000000000000');
    expect(marketNew?.liquidationThresholdMantissa).to.equal('90000000000000');

    // reset
    await comptrollerProxy.setCollateralFactor(
      marketsBeforeEvent[1].id,
      market.collateralFactorMantissa.toString(), // collateral factor
      market.liquidationThresholdMantissa.toString(), // liquidation threshold
    );
  });

  it('handles NewLiquidationIncentive event', async function () {
    const { pools: poolsBeforeEvent } = await subgraphClient.getPools();

    expect(poolsBeforeEvent[0].liquidationIncentiveMantissa).to.equal('1000000000000000000');

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeEvent[0].id);

    const tx = await comptrollerProxy.setLiquidationIncentive('3000000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { pools } = await subgraphClient.getPools();

    expect(pools[0].liquidationIncentiveMantissa).to.equal('3000000000000000000');
    // reset
    await comptrollerProxy.setLiquidationIncentive('1000000000000000000');
  });

  it('handles NewPriceOracle event', async function () {
    const newPriceOracle = '0x0000000000000000000000000000000000000123';
    const { pools } = await subgraphClient.getPools();

    const priceOracle = await ethers.getContract('ResilientOracle');

    expect(pools[0].priceOracleAddress).to.equal(priceOracle.address.toLowerCase());

    const comptrollerProxy = await ethers.getContractAt('Comptroller', pools[0].id);

    const tx = await comptrollerProxy.setPriceOracle(newPriceOracle);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { pools: updatedPools } = await subgraphClient.getPools();

    expect(updatedPools[0].priceOracleAddress).to.equal(newPriceOracle);
    // Reset oracle address
    await comptrollerProxy.setPriceOracle(priceOracle.address);
  });

  it('handles ActionPausedMarket event', async function () {
    const { marketActions: marketActionsBeforeEvent } = await subgraphClient.getMarketActions();

    expect(marketActionsBeforeEvent.length).to.be.equal(0);

    const { markets } = await subgraphClient.getMarkets();
    const market = markets[1];
    const comptrollerProxy = await ethers.getContractAt('Comptroller', market.pool.id);

    const tx = await comptrollerProxy.setActionsPaused([market.id], [1], true);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(4000);

    const { marketActions } = await subgraphClient.getMarketActions();

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
    const { markets: marketsBeforeUpdate } = await subgraphClient.getMarkets();

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

    const { markets } = await subgraphClient.getMarkets();

    vTokenMetadata = await poolLens.vTokenMetadata(marketsBeforeUpdate[0].id);
    expect(markets[0].borrowCapMantissa).to.equal(vTokenMetadata.borrowCaps.toString());
  });

  it('handles NewMinLiquidatableCollateral event', async function () {
    const { pools: poolsBeforeUpdate } = await subgraphClient.getPools();

    expect(poolsBeforeUpdate[0].minLiquidatableCollateralMantissa).to.equal(
      '100000000000000000000',
    );

    const comptrollerProxy = await ethers.getContractAt('Comptroller', poolsBeforeUpdate[0].id);

    const tx = await comptrollerProxy.setMinLiquidatableCollateral('200000000000000000000');
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { pools } = await subgraphClient.getPools();

    expect(pools[0].minLiquidatableCollateralMantissa).to.equal('200000000000000000000');
    // reset
    await comptrollerProxy.setMinLiquidatableCollateral('100000000000000000000');
  });

  it('handles NewSupplyCap event', async function () {
    const { markets: marketsBeforeUpdate } = await subgraphClient.getMarkets();

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

    const { markets } = await subgraphClient.getMarkets();

    vTokenMetadata = await poolLens.vTokenMetadata(marketsBeforeUpdate[0].id);
    expect(markets[0].supplyCapMantissa).to.equal(vTokenMetadata.supplyCaps.toString());
  });
});
