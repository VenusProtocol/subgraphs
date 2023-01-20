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
  let borrower: SignerWithAddress;
  let comptroller: Contract;
  let bnxToken: Contract;
  let vBnxToken: Contract;
  let bswToken: Contract;
  let vBswToken: Contract;

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
    [root, liquidator, borrower, liquidator2] = signers;

    bnxToken = await ethers.getContract('MockBNX');
    bswToken = await ethers.getContract('MockBSW');

    comptroller = await ethers.getContractAt('Comptroller', comptrollerAddress);

    const poolRegistry = await ethers.getContract('PoolRegistry');
    vBnxAddress = await poolRegistry.getVTokenForAsset(comptroller.address, bnxToken.address);
    vBswAddress = await poolRegistry.getVTokenForAsset(comptroller.address, bswToken.address);

    vBnxToken = await ethers.getContractAt('VToken', vBnxAddress);
    vBswToken = await ethers.getContractAt('VToken', vBswAddress);
  });

  it('handles BadDebtIncreased event', async function () {
    // mocking the price oracle and setting low underlying prices
    const mockPriceOracleFactory = await ethers.getContractFactory(
      'MockPriceOracleUnderlyingPrice',
    );
    const mockPriceOracleContract = await mockPriceOracleFactory.deploy();
    await mockPriceOracleContract.setPrice(vBnxToken.address, convertToUnit(1, 5));
    await mockPriceOracleContract.setPrice(vBswToken.address, convertToUnit(1, 5));
    await comptroller.setPriceOracle(mockPriceOracleContract.address);

    await comptroller.connect(liquidator).enterMarkets([vBnxToken.address, vBswToken.address]);
    await comptroller.connect(borrower).enterMarkets([vBnxToken.address, vBswToken.address]);

    // add collateral for the borrower
    await bnxToken.connect(borrower).faucet(borrowAmount);
    await bnxToken.connect(borrower).approve(vBnxToken.address, borrowAmount);

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

    expect(marketsBeforeUpdate[0].badDebtWei).to.equal('0');

    await comptroller.connect(liquidator).healAccount(borrower.address);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarkets();
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { markets } = data!;

    expect(markets[0].badDebtWei).to.equal('6001');

    const { data: accountVTokensData } = await subgraphClient.getAccountVTokens();
    expect(accountVTokensData).to.not.be.equal(undefined);
    const { accountVTokens } = accountVTokensData!;

    const accountVBswData = accountVTokens.find(avt => avt.market.id === vBswAddress.toLowerCase());
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

    expect(marketBeforeEvent?.reservesWei).to.be.equals('0');

    await bswToken.connect(liquidator2).faucet(mintAmount);
    await bswToken.connect(liquidator2).approve(vBswToken.address, mintAmount);

    const vTokenContract = await ethers.getContractAt('VToken', vBswAddress);
    await vTokenContract.connect(liquidator2).addReserves(123);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBswAddress.toLowerCase());
    expect(data).to.not.be.equal(undefined);
    const { market } = data!;

    expect(market?.reservesWei).to.be.equal('123');
  });

  it('handles ReservesReduced event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(vBswAddress.toLowerCase());
    expect(dataBeforeEvent).to.not.be.equal(undefined);
    const { market: marketBeforeEvent } = dataBeforeEvent!;
    expect(marketBeforeEvent).to.not.be.equal(undefined);

    expect(marketBeforeEvent?.reservesWei).to.be.equals('123');

    const vTokenContract = await ethers.getContractAt('VToken', vBswAddress);

    await vTokenContract.connect(liquidator2).reduceReserves(123);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBswAddress.toLowerCase());
    expect(data).to.not.be.equal(undefined);
    const { market } = data!;

    expect(market?.reservesWei).to.be.equal('0');
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
