import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { scaleValue, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';

describe('VToken events', function () {
  const syncDelay = 2000;
  let _root: SignerWithAddress;
  let liquidator: SignerWithAddress;
  let liquidator2: SignerWithAddress;
  let supplier1: SignerWithAddress;
  let supplier2: SignerWithAddress;
  let borrower: SignerWithAddress;
  let borrower2: SignerWithAddress;
  let comptroller: Contract;
  let bnxToken: Contract;
  let vBnxToken: Contract;
  let btcbToken: Contract;
  let vBtcbToken: Contract;
  let mockPriceOracleContract: Contract;

  let comptrollerAddress: string;
  let vBnxAddress: string;
  let vBtcbAddress: string;

  const faucetAmount = scaleValue(5, 18);
  const mintAmount = scaleValue(0.5, 18);
  const borrowAmount = scaleValue(0.000025, 18);

  before(async function () {
    const signers = await ethers.getSigners();
    [_root, liquidator, borrower, liquidator2, borrower2, supplier1, supplier2] = signers;

    const poolRegistry = await ethers.getContract('PoolRegistry');
    const poolLens = await ethers.getContract('PoolLens');
    const pools = await poolLens.getAllPools(poolRegistry.address);

    comptrollerAddress = pools[0].comptroller;
    comptroller = await ethers.getContractAt('Comptroller', comptrollerAddress);

    const protocolShareReserve = await ethers.getContract('ProtocolShareReserve');

    await protocolShareReserve.setPoolRegistry(poolRegistry.address);

    bnxToken = await ethers.getContract('MockBNX');
    btcbToken = await ethers.getContract('MockBTCB');

    vBnxAddress = await poolRegistry.getVTokenForAsset(comptroller.address, bnxToken.address);
    vBtcbAddress = await poolRegistry.getVTokenForAsset(comptroller.address, btcbToken.address);

    vBnxToken = await ethers.getContractAt('VToken', vBnxAddress);
    vBtcbToken = await ethers.getContractAt('VToken', vBtcbAddress);

    await comptroller.connect(borrower).enterMarkets([vBnxToken.address, vBtcbToken.address]);

    // Setup initial supply
    await bnxToken.faucet(faucetAmount.toString());
    await bnxToken.approve(vBnxToken.address, faucetAmount.toString());
    await vBnxToken.mint(mintAmount.times(4).toString());
    await btcbToken.faucet(faucetAmount.toString());
    await btcbToken.approve(vBtcbToken.address, faucetAmount.toString());
    await vBtcbToken.mint(mintAmount.times(4).toString());

    // Fund and Approve suppliers
    await btcbToken.connect(supplier1).faucet(faucetAmount.toString());
    await btcbToken.connect(supplier1).approve(vBtcbToken.address, faucetAmount.toString());
    await btcbToken.connect(supplier2).faucet(faucetAmount.toString());
    await btcbToken.connect(supplier2).approve(vBtcbToken.address, faucetAmount.toString());

    // Fund and Approve borrowers
    await btcbToken.connect(borrower).faucet(faucetAmount.toString());
    await btcbToken.connect(borrower).approve(vBtcbToken.address, faucetAmount.toString());
    await btcbToken.connect(borrower2).faucet(borrowAmount.toString());
    await btcbToken.connect(borrower2).approve(vBtcbToken.address, faucetAmount.toString());

    await bnxToken.connect(borrower).faucet(faucetAmount.times(2).toString());
    await bnxToken.connect(borrower).approve(vBnxToken.address, faucetAmount.toString());
    await bnxToken.connect(borrower2).faucet(borrowAmount.toString());
    const tx = await bnxToken
      .connect(borrower2)
      .approve(vBnxToken.address, faucetAmount.toString());

    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);
  });

  it('updates the supplierCount for the market', async function () {
    const { data: initialData } = await subgraphClient.getMarketById(vBtcbAddress.toLowerCase());
    const { market: initialMarketQuery } = initialData!;

    // liquidator1 and liquidator2 are supplying BSW
    expect(initialMarketQuery?.supplierCount).to.equal('1');
    // adding two new suppliers
    let tx = await vBtcbToken.connect(supplier1).mint(mintAmount.toString());
    await tx.wait(1);

    // @todo check entering market
    // await comptroller.connect(supplier2).enterMarkets([vBnxToken.address, vBtcbToken.address]);
    tx = await vBtcbToken.connect(supplier2).mint(mintAmount.toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataWithNewSupplier } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketsQueryAfterNewSupplier } = dataWithNewSupplier!;
    expect(marketsQueryAfterNewSupplier?.supplierCount).to.equal('3');

    // removing supplier
    tx = await vBtcbToken.connect(supplier1).redeemUnderlying(mintAmount.toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataWithoutNewSupplier } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketQueryAfterRemovingSupplier } = dataWithoutNewSupplier!;

    expect(marketQueryAfterRemovingSupplier?.supplierCount).to.equal('2');

    // partially redeeming should not decrease count
    const halfMintAmount = mintAmount.dividedBy(2);
    tx = await vBtcbToken.connect(supplier2).redeemUnderlying(halfMintAmount.toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataAfterHalfRedeem } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketAfterHalfRedeem } = dataAfterHalfRedeem!;

    expect(marketAfterHalfRedeem?.supplierCount).to.equal('2');

    // now redeem remaining amount and remove supplier
    tx = await vBtcbToken.connect(supplier2).redeemUnderlying(halfMintAmount.toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBtcbAddress.toLowerCase());
    const { market } = data!;

    expect(market?.supplierCount).to.equal('1');
  });

  it('updates the borrowerCount for the market', async function () {
    const { data: initialData } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());
    const { market: marketBeforeData } = initialData!;
    expect(marketBeforeData?.borrowerCount).to.equal('0');
    // Borrower supplies BTCB and borrows BNX
    await btcbToken.connect(borrower2).faucet(mintAmount.toString());
    await vBtcbToken.connect(borrower2).mint(mintAmount.toString());
    await comptroller.connect(borrower2).enterMarkets([vBnxToken.address, vBtcbToken.address]);
    // borrowing adds to count
    let tx = await vBnxToken.connect(borrower2).borrow(borrowAmount.toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataAfterBorrow } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());
    const { market: marketAfterBorrow } = dataAfterBorrow!;

    expect(marketAfterBorrow?.borrowerCount).to.equal('1');

    // completely repaying the borrow should decrease the count
    tx = await vBnxToken.connect(borrower2).repayBorrow(borrowAmount.times(1.5).toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());
    const { market } = data!;

    expect(market?.borrowerCount).to.equal('0');
  });

  it('handles BadDebtIncreased event', async function () {
    // Borrower supplies BNX and borrows BTCB
    await vBtcbToken.connect(borrower).mint(mintAmount.toString());
    await vBnxToken.connect(borrower).borrow(scaleValue(0.0004446, 18).toString());

    const mockPriceOracleFactory = await ethers.getContractFactory(
      'MockPriceOracleUnderlyingPrice',
    );
    mockPriceOracleContract = await mockPriceOracleFactory.deploy();
    // set lower price for collateral asset
    await mockPriceOracleContract.setPrice(vBtcbToken.address, scaleValue(0.00005, 10).toString());
    await mockPriceOracleContract.setPrice(vBnxToken.address, scaleValue(160, 18).toString());
    let tx = await comptroller.setPriceOracle(mockPriceOracleContract.address);
    tx.wait(1);

    await bnxToken.connect(liquidator).faucet(faucetAmount.toString());
    await bnxToken.connect(liquidator).approve(vBnxToken.address, faucetAmount.toString());
    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());
    const { market: marketBeforeUpdate } = dataBeforeEvent!;

    expect(marketBeforeUpdate?.badDebtMantissa).to.equal('0');

    tx = await comptroller.connect(liquidator).healAccount(borrower.address);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(4000);

    const { data } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());
    const { market } = data!;

    expect(market?.badDebtMantissa).to.equal('444600002962838');

    const { data: accountVTokensData } = await subgraphClient.getAccountVTokens();
    const { accountVTokens } = accountVTokensData!;

    const vBnxAccountTokens = accountVTokens.find(avt =>
      avt.id.includes(borrower.address.toLowerCase()),
    );
    expect(vBnxAccountTokens?.badDebt.length).to.be.equal(1);
    expect(vBnxAccountTokens?.badDebt[0].amountMantissa).to.be.equal('444600002962838');
  });

  it('handles ReservesAdded event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketBeforeEvent } = dataBeforeEvent!;

    expect(marketBeforeEvent?.reservesMantissa).to.be.equals('8333330000000000');

    await btcbToken.connect(liquidator2).faucet(faucetAmount.toString());
    await btcbToken.connect(liquidator2).approve(vBtcbToken.address, faucetAmount.toString());

    const vTokenContract = await ethers.getContractAt('VToken', vBtcbAddress);
    const tx = await vTokenContract
      .connect(liquidator2)
      .addReserves(scaleValue(0.5, 18).toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBtcbAddress.toLowerCase());
    const { market } = data!;

    expect(market?.reservesMantissa).to.be.equal('508333330000000000');
  });

  it('handles SpreadReservesReduced event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketBeforeEvent } = dataBeforeEvent!;

    expect(marketBeforeEvent?.reservesMantissa).to.be.equals('508333330000000000');

    const vTokenContract = await ethers.getContractAt('VToken', vBtcbAddress);

    const tx = await vTokenContract
      .connect(liquidator2)
      .reduceReserves(scaleValue(0.5, 18).toString());
    tx.wait(1);
    await waitForSubgraphToBeSynced(4000);

    const { data } = await subgraphClient.getMarketById(vBtcbAddress.toLowerCase());
    const { market } = data!;

    expect(market?.reservesMantissa).to.be.equal('8333330000000000');
  });
});
