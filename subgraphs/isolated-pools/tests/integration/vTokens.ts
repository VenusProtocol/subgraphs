import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { scaleValue, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client';

const { parseUnits } = ethers.utils;
const { MaxUint256 } = ethers.constants;

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
  let btcbToken: Contract;
  let vBtcbToken: Contract;
  let oracle: Contract;

  let comptrollerAddress: string;
  let vBnxAddress: string;
  let vBtcbAddress: string;

  before(async function () {
    const signers = await ethers.getSigners();
    [root, supplier1, supplier2, borrower, borrower2, liquidator, liquidator2] = signers;

    const fundAccounts = async (token: Contract, amount: string) => {
      const underlying = await token.underlying();
      const underlyingContract = await ethers.getContractAt('BEP20Harness', underlying);
      await Promise.all(
        [supplier1, supplier2, borrower, borrower2, liquidator, liquidator2].map(async account => {
          await underlyingContract.connect(account).faucet(amount);
          await underlyingContract.connect(account).approve(token.address, MaxUint256);
          await underlyingContract.connect(root).faucet(amount);
          await underlyingContract.connect(root).approve(token.address, MaxUint256);
        }),
      );
    };

    const poolRegistry = await ethers.getContract('PoolRegistry');
    const poolLens = await ethers.getContract('PoolLens');
    const pools = await poolLens.getAllPools(poolRegistry.address);

    comptrollerAddress = pools[0].comptroller;
    comptroller = await ethers.getContractAt('Comptroller', comptrollerAddress);

    bnxToken = await ethers.getContract('MockBNX');
    btcbToken = await ethers.getContract('MockBTCB');

    vBnxAddress = await poolRegistry.getVTokenForAsset(comptroller.address, bnxToken.address);
    vBtcbAddress = await poolRegistry.getVTokenForAsset(comptroller.address, btcbToken.address);

    vBnxToken = await ethers.getContractAt('VToken', vBnxAddress);
    vBtcbToken = await ethers.getContractAt('VToken', vBtcbAddress);

    // Set Prices
    oracle = await ethers.getContract('MockPriceOracleUnderlyingPrice');
    await comptroller.setPriceOracle(oracle.address);
    await oracle.setPrice(vBnxToken.address, parseUnits('2', 18).toString());
    await oracle.setPrice(vBtcbToken.address, parseUnits('50000', 18).toString());

    const protocolShareReserve = await ethers.getContract('ProtocolShareReserve');
    await protocolShareReserve.setPoolRegistry(poolRegistry.address);

    const accessControlManager = await ethers.getContract('AccessControlManager');
    const tx = await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setMinLiquidatableCollateral(uint256)',
      root.address,
    );
    await tx.wait();

    // Setup initial supply
    await Promise.all(
      (
        [
          [vBnxToken, parseUnits('10000000', 18).toString()],
          [vBtcbToken, parseUnits('10000000', 18).toString()],
        ] as [Contract, string][]
      ).map(async data => {
        await fundAccounts(data[0], data[1]);
      }),
    );

    await waitForSubgraphToBeSynced(syncDelay);
  });

  it('updates the supplierCount for the market', async function () {
    const { data: initialData } = await subgraphClient.getMarketById(vBtcbAddress.toLowerCase());
    const { market: initialMarketQuery } = initialData!;

    const btcb5000Usd = await oracle.getAssetTokenAmount(
      vBtcbToken.address,
      parseUnits('5000', 36),
    );

    // 1 current supply
    expect(initialMarketQuery?.supplierCount).to.equal('1');
    // adding two new suppliers
    let tx = await vBtcbToken.connect(supplier1).mint(btcb5000Usd.toString());
    await tx.wait(1);

    tx = await vBtcbToken.connect(supplier2).mint(btcb5000Usd.toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    // Check querying pools by account
    const { data: positionData } = await subgraphClient.getAccountPositions(
      supplier1.address.toLowerCase(),
    );
    const { account } = positionData!;
    expect(account.pools.length).to.equal(1);
    // @todo rename account.pools[0].supply
    expect(account.pools[0].collateral.length).to.equal(1);

    const { data: dataWithNewSupplier } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketsQueryAfterNewSupplier } = dataWithNewSupplier!;
    expect(marketsQueryAfterNewSupplier?.supplierCount).to.equal('3');

    // removing supplier
    tx = await vBtcbToken.connect(supplier1).redeemUnderlying(btcb5000Usd.toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataWithoutNewSupplier } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketQueryAfterRemovingSupplier } = dataWithoutNewSupplier!;

    expect(marketQueryAfterRemovingSupplier?.supplierCount).to.equal('2');

    // partially redeeming should not decrease count
    const btcb10Usd = await oracle.getAssetTokenAmount(vBtcbToken.address, parseUnits('10', 36));
    tx = await vBtcbToken.connect(supplier2).redeemUnderlying(btcb10Usd.toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataAfterHalfRedeem } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketAfterHalfRedeem } = dataAfterHalfRedeem!;

    expect(marketAfterHalfRedeem?.supplierCount).to.equal('2');
  });

  it('updates the borrowerCount for the market', async function () {
    const { data: initialData } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());
    const { market: marketBeforeData } = initialData!;
    expect(marketBeforeData?.borrowerCount).to.equal('0');

    const btcb10000Usd = await oracle.getAssetTokenAmount(
      vBtcbToken.address,
      parseUnits('1000000', 36),
    );

    const bnx20000Usd = await oracle.getAssetTokenAmount(
      vBnxToken.address,
      parseUnits('500000', 36),
    );

    const bnx1000Usd = await oracle.getAssetTokenAmount(vBnxToken.address, parseUnits('10000', 36));

    // Root supplies BNX
    await vBnxToken.connect(root).mint(bnx20000Usd.toString());
    // // Borrower supplies BTCB and borrows BNX
    await vBtcbToken.connect(borrower).mint(btcb10000Usd.toString());
    await vBtcbToken.connect(borrower2).mint(btcb10000Usd.toString());
    // @todo check entering market
    await comptroller.connect(borrower).enterMarkets([vBtcbToken.address]);
    let tx = await comptroller.connect(borrower2).enterMarkets([vBtcbToken.address]);
    await tx.wait(1);

    // borrowing adds to count
    await vBnxToken.connect(borrower).borrow(bnx1000Usd.toString());
    tx = await vBnxToken.connect(borrower2).borrow(bnx1000Usd.toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataAfterBorrow } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());
    const { market: marketAfterBorrow } = dataAfterBorrow!;

    expect(marketAfterBorrow?.borrowerCount).to.equal('2');

    tx = await vBnxToken.connect(borrower2).borrow(bnx1000Usd.toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data: dataAfterBorrow2 } = await subgraphClient.getMarketById(
      vBnxAddress.toLowerCase(),
    );
    const { market: marketAfterBorrow2 } = dataAfterBorrow2!;

    expect(marketAfterBorrow2?.borrowerCount).to.equal('2');

    const { data: positionData } = await subgraphClient.getAccountPositions(
      borrower2.address.toLowerCase(),
    );
    const { account } = positionData!;

    expect(account.pools.length).to.equal(1);
    expect(account.pools[0].borrows.length).to.equal(1);
    expect(account.pools[0].collateral.length).to.equal(1);

    // completely repaying the borrow should decrease the count
    tx = await vBnxToken
      .connect(borrower)
      .repayBorrow((await vBnxToken.callStatic.borrowBalanceCurrent(borrower.address)) + 10000n);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());
    const { market } = data!;

    expect(market?.borrowerCount).to.equal('1');

    const { data: positionDataAfter } = await subgraphClient.getAccountPositions(
      borrower2.address.toLowerCase(),
    );
    const { account: accountAfter } = positionDataAfter!;
    expect(accountAfter.pools.length).to.equal(1);
    expect(accountAfter.pools[0].borrows.length).to.equal(1);
  });

  it('should handle liquidateBorrow event', async function () {
    await oracle.setPrice(vBtcbToken.address, parseUnits('2500', 18).toString());
    await oracle.setPrice(vBnxToken.address, parseUnits('1500', 18).toString());

    const liquidateAmount = await oracle.getAssetTokenAmount(
      vBtcbToken.address,
      parseUnits('200', 36),
    );
    await vBnxToken
      .connect(liquidator)
      .liquidateBorrow(borrower2.address, liquidateAmount.toString(), vBtcbToken.address);

    await waitForSubgraphToBeSynced(syncDelay);

    const { data: updatedAccountVTokenData } =
      await subgraphClient.getAccountVTokenByAccountAndMarket(
        borrower2.address.toLowerCase(),
        vBnxToken.address.toLowerCase(),
      );
    const { accountVTokens } = updatedAccountVTokenData!;

    expect(accountVTokens[0]?.accountBorrowBalanceMantissa).to.be.approximately(
      await vBnxToken.callStatic.borrowBalanceCurrent(borrower2.address),
      1e11,
    );

    const {
      data: { account: accountBorrower },
    } = await subgraphClient.getAccountById(borrower2.address.toLowerCase());
    expect(accountBorrower.countLiquidated).to.equal(1);

    const {
      data: { account: accountLiquidator },
    } = await subgraphClient.getAccountById(liquidator.address.toLowerCase());
    expect(accountLiquidator.countLiquidator).to.equal(1);

    const { data: dataWithAddedLiquidatorSupplier } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketWithAddedLiquidatorSupplier } = dataWithAddedLiquidatorSupplier!;

    // Two borrowers and liquidator added as suppliers
    expect(marketWithAddedLiquidatorSupplier?.supplierCount).to.equal('5');

    const { data: liquidatorAccountVTokenData } =
      await subgraphClient.getAccountVTokenByAccountAndMarket(
        liquidator.address.toLowerCase(),
        vBtcbToken.address.toLowerCase(),
      );
    const { accountVTokens: liquidatorAccountVTokens } = liquidatorAccountVTokenData!;

    expect(liquidatorAccountVTokens[0]?.accountVTokenSupplyBalanceMantissa).to.be.approximately(
      ethers.BigNumber.from(await vBtcbToken.balanceOf(liquidator.address)),
      1e11,
    );
    // @todo Fix collateral error causing this part of the test to fail
    // let borrowBalanceCurrent = await vBnxToken.borrowBalanceStored(borrower2.address);
    // await vBnxToken.connect(borrower2).repayBorrow(borrowBalanceCurrent.sub(1000000));

    // await oracle.setPrice(vBtcbToken.address, parseUnits('1', 18).toString());
    // await oracle.setPrice(vBnxToken.address, parseUnits('1000000', 18).toString());

    // borrowBalanceCurrent = await vBnxToken.callStatic.borrowBalanceCurrent(borrower2.address);

    // // liquidate rest of borrow
    // await comptroller.connect(liquidator).liquidateAccount(borrower2.address, [
    //   {
    //     vTokenCollateral: vBtcbToken.address,
    //     vTokenBorrowed: vBnxToken.address,
    //     repayAmount: borrowBalanceCurrent.add(18098),
    //   },
    // ]);

    // await waitForSubgraphToBeSynced(syncDelay);

    // const { data: bnxMarketData } = await subgraphClient.getMarketById(
    //   vBnxToken.address.toLowerCase(),
    // );
    // const { market: bnxMarket } = bnxMarketData!;
    // expect(bnxMarket.borrowerCount).to.equal('0');

    // Reset prices
    await oracle.setPrice(vBnxToken.address, parseUnits('2', 18).toString());
    await oracle.setPrice(vBtcbToken.address, parseUnits('50000', 18).toString());
  });

  it('handles BadDebtIncreased event', async function () {
    // Borrower supplies BNX and borrows BTCB
    const btcb1000Usd = await oracle.getAssetTokenAmount(
      vBtcbToken.address,
      parseUnits('10000', 36),
    );
    await vBtcbToken.connect(borrower).mint(btcb1000Usd.toString());
    await vBnxToken.connect(borrower).borrow(scaleValue(0.0004446, 18).toString());

    // set lower price for collateral asset
    await oracle.setPrice(vBtcbToken.address, scaleValue(0.00005, 10).toString());
    await oracle.setPrice(vBnxToken.address, scaleValue(160, 18).toString());

    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());
    const { market: marketBeforeUpdate } = dataBeforeEvent!;

    expect(marketBeforeUpdate?.badDebtMantissa).to.equal('0');

    const tx = await comptroller.connect(liquidator).healAccount(borrower.address);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(4000);

    const { data } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());
    const { market } = data!;

    expect(market?.badDebtMantissa).to.equal((await vBnxToken.badDebt()).toString());

    const { data: accountVTokensData } = await subgraphClient.getAccountVTokens();
    const { accountVTokens } = accountVTokensData!;

    const vBnxAccountTokens = accountVTokens.find(
      avt =>
        avt.id.includes(borrower.address.slice(2, 42).toLowerCase()) &&
        avt.market.id.toLowerCase() == vBnxToken.address.toLowerCase(),
    );
    expect(vBnxAccountTokens?.badDebt.length).to.be.equal(1);
    expect(vBnxAccountTokens?.badDebt[0].amountMantissa).to.be.equal(
      (await vBnxToken.badDebt()).toString(),
    );
  });

  it('handles ReservesAdded event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketBeforeEvent } = dataBeforeEvent!;
    expect(marketBeforeEvent?.reservesMantissa).to.be.equals('0');

    const vTokenContract = await ethers.getContractAt('VToken', vBtcbAddress);
    const tx = await vTokenContract
      .connect(liquidator2)
      .addReserves(scaleValue(0.5, 18).toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const { data } = await subgraphClient.getMarketById(vBtcbAddress.toLowerCase());
    const { market } = data!;

    expect(market?.reservesMantissa).to.be.equal('500000000000000000');
  });

  it('handles SpreadReservesReduced event', async function () {
    const { data: dataBeforeEvent } = await subgraphClient.getMarketById(
      vBtcbAddress.toLowerCase(),
    );
    const { market: marketBeforeEvent } = dataBeforeEvent!;

    expect(marketBeforeEvent?.reservesMantissa).to.be.equals('500000000000000000');

    const vTokenContract = await ethers.getContractAt('VToken', vBtcbAddress);

    const tx = await vTokenContract
      .connect(liquidator2)
      .reduceReserves(scaleValue(0.5, 18).toString());
    tx.wait(1);
    await waitForSubgraphToBeSynced(4000);

    const { data } = await subgraphClient.getMarketById(vBtcbAddress.toLowerCase());
    const { market } = data!;

    expect(market?.reservesMantissa).to.be.equal('0');
  });
});
