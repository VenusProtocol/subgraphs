import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';
import deploy from './utils/deploy';

describe('VToken events', function () {
  const syncDelay = 2000;
  let root: SignerWithAddress;
  let liquidator: SignerWithAddress;
  let liquidator2: SignerWithAddress;
  let supplier1: SignerWithAddress;
  let supplier2: SignerWithAddress;
  let borrower: SignerWithAddress;
  let borrower2: SignerWithAddress;
  let comptroller: Contract;
  let bnxToken: Contract;
  let vBnxToken: Contract;
  let bswToken: Contract;
  let vBswToken: Contract;
  let mockPriceOracleContract: Contract;

  const comptrollerAddress = '0x9467A509DA43CB50EB332187602534991Be1fEa4';
  let vBnxAddress: string;
  let vBswAddress: string;

  const convertToUnit = (amount: string | number, decimals: number) => {
    return new BigNumber(amount).times(new BigNumber(10).pow(decimals)).toString();
  };

  const mintAmount = convertToUnit(1, 4);
  const borrowAmount = convertToUnit(1.1, 4);
  const liquidatorAllowance = convertToUnit(1, 5);

  before(async function () {
    this.timeout(500000); // sometimes it takes a long time
    await deploy();

    const signers = await ethers.getSigners();
    [root, liquidator, borrower, liquidator2, borrower2, supplier1, supplier2] = signers;

    bnxToken = await ethers.getContract('MockBNX');
    bswToken = await ethers.getContract('MockBSW');

    comptroller = await ethers.getContractAt('Comptroller', comptrollerAddress);

    const poolRegistry = await ethers.getContract('PoolRegistry');
    vBnxAddress = await poolRegistry.getVTokenForAsset(comptroller.address, bnxToken.address);
    vBswAddress = await poolRegistry.getVTokenForAsset(comptroller.address, bswToken.address);

    vBnxToken = await ethers.getContractAt('VToken', vBnxAddress);
    vBswToken = await ethers.getContractAt('VToken', vBswAddress);

    // mocking the price oracle and setting low underlying prices
    const mockPriceOracleFactory = await ethers.getContractFactory(
      'MockPriceOracleUnderlyingPrice',
    );

    mockPriceOracleContract = await mockPriceOracleFactory.deploy();
    await mockPriceOracleContract.setPrice(vBnxToken.address, convertToUnit(1, 5));
    await mockPriceOracleContract.setPrice(vBswToken.address, convertToUnit(1, 5));
    await comptroller.setPriceOracle(mockPriceOracleContract.address);

    await comptroller.connect(liquidator).enterMarkets([vBnxToken.address, vBswToken.address]);
    await comptroller.connect(borrower).enterMarkets([vBnxToken.address, vBswToken.address]);

    // add collateral for the borrowers
    await bnxToken.connect(borrower).faucet(borrowAmount);
    await bnxToken.connect(borrower).approve(vBnxToken.address, borrowAmount);
    await bnxToken.connect(borrower2).faucet(borrowAmount);
    await bnxToken.connect(borrower2).approve(vBnxToken.address, borrowAmount);

    // add collateral for the liquidator
    await bswToken.connect(liquidator).faucet(mintAmount);
    await bswToken.connect(liquidator).approve(vBswToken.address, mintAmount);

    // add collateral for the second liquidator
    await bswToken.connect(liquidator2).faucet(mintAmount);
    await bswToken.connect(liquidator2).approve(vBswToken.address, mintAmount);

    // mint them in the respective VTokens
    await vBswToken.connect(liquidator).mint(mintAmount);
    await vBswToken.connect(liquidator2).mint(mintAmount);
    await vBnxToken.connect(borrower).mint(mintAmount);
    await vBnxToken.connect(borrower2).mint(mintAmount);
    await waitForSubgraphToBeSynced(syncDelay);
  });

  it('updates the supplierCount for the market', async function () {
    const { data: initialData } = await subgraphClient.getMarkets();
    expect(initialData).to.not.be.equal(undefined);
    const { markets: initialMarketsQuery } = initialData!;

    // liquidator1 and liquidator2 are supplying BSW
    expect(initialMarketsQuery[0].supplierCount).to.equal('2');

    // adding two new suppliers
    await comptroller.connect(supplier1).enterMarkets([vBnxToken.address, vBswToken.address]);
    await bswToken.connect(supplier1).faucet(mintAmount);
    await bswToken.connect(supplier1).approve(vBswToken.address, mintAmount);
    await vBswToken.connect(supplier1).mint(mintAmount);

    await comptroller.connect(supplier2).enterMarkets([vBnxToken.address, vBswToken.address]);
    await bswToken.connect(supplier2).faucet(mintAmount);
    await bswToken.connect(supplier2).approve(vBswToken.address, mintAmount);
    await vBswToken.connect(supplier2).mint(mintAmount);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataWithNewSupplier } = await subgraphClient.getMarkets();
    expect(dataWithNewSupplier).to.not.be.equal(undefined);
    const { markets: marketsQueryAfterNewSupplier } = dataWithNewSupplier!;

    expect(marketsQueryAfterNewSupplier[0].supplierCount).to.equal('4');

    // removing supplier
    await vBswToken.connect(supplier1).redeem(mintAmount);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataWithoutNewSupplier } = await subgraphClient.getMarkets();
    expect(dataWithoutNewSupplier).to.not.be.equal(undefined);
    const { markets: marketsQueryAfterRemovingSupplier } = dataWithoutNewSupplier!;

    expect(marketsQueryAfterRemovingSupplier[0].supplierCount).to.equal('3');

    // partially redeeming should not decrease count
    const halfMintAmount = convertToUnit(0.5, 4);
    await vBswToken.connect(supplier2).redeem(halfMintAmount);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataAfterHalfRedeem } = await subgraphClient.getMarkets();
    expect(dataAfterHalfRedeem).to.not.be.equal(undefined);
    const { markets: marketsAfterHalfRedeem } = dataAfterHalfRedeem!;

    expect(marketsAfterHalfRedeem[0].supplierCount).to.equal('3');

    // now redeem remaining amount and remove supplier
    await vBswToken.connect(supplier2).redeem(halfMintAmount);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarkets();
    expect(data).to.not.be.equal(undefined);
    const { markets } = data!;

    expect(markets[0].supplierCount).to.equal('2');
  });

  it('updates the borrowerCount for the market', async function () {
    const { data: initialData } = await subgraphClient.getMarkets();
    expect(initialData).to.not.be.equal(undefined);
    const { markets: marketsBeforeData } = initialData!;

    expect(marketsBeforeData[0].borrowerCount).to.equal('0');

    // borrowing adds to count
    await bswToken.connect(borrower2).faucet(borrowAmount);
    await bswToken.connect(borrower2).approve(vBswToken.address, borrowAmount);
    await vBswToken.connect(borrower2).borrow(borrowAmount);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataAfterBorrow } = await subgraphClient.getMarkets();
    expect(dataAfterBorrow).to.not.be.equal(undefined);
    const { markets: marketAfterBorrow } = dataAfterBorrow!;

    expect(marketAfterBorrow[0].borrowerCount).to.equal('1');

    // completely repaying the borrow should decrease the count
    await bswToken.connect(borrower2).faucet(borrowAmount);
    await bswToken.connect(borrower2).approve(vBswToken.address, borrowAmount);
    await vBswToken.connect(borrower2).repayBorrow(borrowAmount);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarkets();
    expect(data).to.not.be.equal(undefined);
    const { markets } = data!;

    expect(markets[0].borrowerCount).to.equal('0');
  });

  it('handles BadDebtIncreased event', async function () {
    // borrower borrows BSW
    await vBswToken.connect(borrower).borrow(borrowAmount);

    // set higher underlying prices
    await mockPriceOracleContract.setPrice(vBnxToken.address, convertToUnit(1, 20));
    await mockPriceOracleContract.setPrice(vBswToken.address, convertToUnit(1, 20));

    // add allowance to the liquidator to be used when healing the borrower
    await bswToken.connect(liquidator).faucet(mintAmount);
    await bswToken.connect(liquidator).approve(vBswToken.address, liquidatorAllowance);

    const { data: dataBeforeEvent } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets: marketsBeforeUpdate } = dataBeforeEvent!;

    expect(marketsBeforeUpdate[0].badDebtMantissa).to.equal('0');

    await comptroller.connect(liquidator).healAccount(borrower.address);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets } = data!;

    expect(markets[0].badDebtMantissa).to.equal('6001');

    const { data: accountVTokensData } = await subgraphClient.getAccountVTokens();
    expect(accountVTokensData).to.not.be.equal(undefined);
    const { accountVTokens } = accountVTokensData!;

    const accountVBswData = accountVTokens.find(avt =>
      avt.id.includes(borrower.address.toLowerCase()),
    );
    expect(accountVBswData?.badDebt.length).to.be.equal(1);
    expect(accountVBswData?.badDebt[0].amount).to.be.equal('6001');
  });

  it('handles NewAccessControlManager event', async function () {
    const newACM = '0x0000000000000000000000000000000000000123';
    const { data: dataBeforeEvent } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets: marketsBeforeUpdate } = dataBeforeEvent!;

    expect(marketsBeforeUpdate[0].accessControlManager).to.equal(
      '0xc5a5c42992decbae36851359345fe25997f5c42d',
    );

    const vTokenContract = await ethers.getContractAt('VToken', marketsBeforeUpdate[0].id);
    await vTokenContract.connect(root).setAccessControlAddress(newACM);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets } = data!;

    expect(markets[0].accessControlManager).to.equal(newACM);
  });

  it('handles ReservesAdded event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(vBswAddress.toLowerCase());
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { market: marketBeforeEvent } = dataBeforeEvent!;
    expect(marketBeforeEvent).to.not.be.equal(undefined);

    expect(marketBeforeEvent?.reservesMantissa).to.be.equals('0');

    await bswToken.connect(liquidator2).faucet(mintAmount);
    await bswToken.connect(liquidator2).approve(vBswToken.address, mintAmount);

    const vTokenContract = await ethers.getContractAt('VToken', vBswAddress);
    await vTokenContract.connect(liquidator2).addReserves(123);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBswAddress.toLowerCase());
    expect(data).to.not.be.equal(undefined);
    const { market } = data!;

    expect(market?.reservesMantissa).to.be.equal('123');
  });

  it('handles ReservesReduced event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(vBswAddress.toLowerCase());
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { market: marketBeforeEvent } = dataBeforeEvent!;
    expect(marketBeforeEvent).to.not.be.equal(undefined);

    expect(marketBeforeEvent?.reservesMantissa).to.be.equals('123');

    const vTokenContract = await ethers.getContractAt('VToken', vBswAddress);

    await vTokenContract.connect(liquidator2).reduceReserves(123);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBswAddress.toLowerCase());
    expect(data).to.not.be.equal(undefined);
    const { market } = data!;

    expect(market?.reservesMantissa).to.be.equal('0');
  });

  it('handles NewComptroller event', async function () {
    const accessControlManager = await ethers.getContract('AccessControlManager');
    const poolRegistry = await ethers.getContract('PoolRegistry');
    const mockNewComptrollerFactory = await ethers.getContractFactory('Comptroller');
    const mockNewComptrollerContract = await mockNewComptrollerFactory.deploy(
      poolRegistry.address,
      accessControlManager.address,
    );

    const { data: dataBeforeEvent } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets: marketsBeforeUpdate } = dataBeforeEvent!;

    expect(marketsBeforeUpdate[0].pool.id).to.equal('0x9467a509da43cb50eb332187602534991be1fea4');

    const vTokenContract = await ethers.getContractAt('VToken', marketsBeforeUpdate[0].id);
    await vTokenContract.connect(root).setComptroller(mockNewComptrollerContract.address);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets } = data!;

    expect(markets[0].pool.id).to.equal(mockNewComptrollerContract.address.toLowerCase());
  });
});
