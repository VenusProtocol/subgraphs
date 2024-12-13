import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { waitForSubgraphToBeSynced } from '@venusprotocol/subgraph-utils';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import createSubgraphClient from '../../subgraph-client';
import { checkMarketPosition, checkMarket } from './checkEntities';

const subgraphClient = createSubgraphClient(
  'http://graph-node:8000/subgraphs/name/venusprotocol/venus-isolated-pools',
);

const { parseUnits } = ethers.utils;
const { MaxUint256 } = ethers.constants;

describe('VToken events', function () {
  const syncDelay = 2000;
  let root: SignerWithAddress;
  let supplier1: SignerWithAddress;
  let supplier2: SignerWithAddress;
  let borrower1: SignerWithAddress;
  let borrower2: SignerWithAddress;
  let liquidator1: SignerWithAddress;
  let liquidator2: SignerWithAddress;
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
    [root, supplier1, supplier2, borrower1, borrower2, liquidator1, liquidator2] = signers;

    const fundAccounts = async (token: Contract, amount: string) => {
      const underlying = await token.underlying();
      const underlyingContract = await ethers.getContractAt('BEP20Harness', underlying);
      await Promise.all(
        [supplier1, supplier2, borrower1, borrower2, liquidator1, liquidator2].map(
          async account => {
            await underlyingContract.connect(account).faucet(amount);
            await underlyingContract.connect(account).approve(token.address, MaxUint256);
            await underlyingContract.connect(root).faucet(amount);
            await underlyingContract.connect(root).approve(token.address, MaxUint256);
          },
        ),
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

  it('should update correctly when minting', async function () {
    const btcb1000Usd = await oracle.getAssetTokenAmount(
      vBtcbToken.address,
      parseUnits('1000', 36),
    );

    // adding two new suppliers
    const tx1 = await vBtcbToken.connect(supplier1).mint(btcb1000Usd.toString());
    await tx1.wait(1);

    const tx2 = await vBtcbToken.connect(supplier2).mint(btcb1000Usd.toString());
    await tx2.wait(1);

    await waitForSubgraphToBeSynced(syncDelay);

    checkMarketPosition(supplier1.address, vBtcbToken.address, tx1);

    checkMarketPosition(supplier2.address, vBtcbToken.address, tx2);
    const vBtcbMarket = await checkMarket(vBtcbToken.address);
    // Deployer is initial supplier
    expect(vBtcbMarket?.supplierCount).to.equal('3');
  });

  it('should not increment supplier count and update correctly when mint again', async function () {
    const btcb5000Usd = await oracle.getAssetTokenAmount(
      vBtcbToken.address,
      parseUnits('5000', 36),
    );

    const bnx5000Usd = await oracle.getAssetTokenAmount(vBnxToken.address, parseUnits('5000', 36));
    // adding two new suppliers
    const tx1 = await vBtcbToken.connect(supplier1).mint(btcb5000Usd.toString());
    await tx1.wait(1);

    const tx2 = await vBtcbToken.connect(supplier2).mint(btcb5000Usd.toString());
    await tx2.wait(1);

    await waitForSubgraphToBeSynced(syncDelay);

    checkMarketPosition(supplier1.address, vBtcbToken.address, tx1);

    checkMarketPosition(supplier2.address, vBtcbToken.address, tx2);

    const vBtcbMarket = await checkMarket(vBtcbToken.address);
    // Deployer is initial supplier
    expect(vBtcbMarket?.supplierCount).to.equal('3');

    await vBnxToken.connect(root).mintBehalf(supplier1.address, bnx5000Usd.toString());
    await vBnxToken.connect(root).mintBehalf(supplier2.address, bnx5000Usd.toString());

    await waitForSubgraphToBeSynced(syncDelay);

    checkMarketPosition(supplier1.address, vBnxToken.address, tx1);

    checkMarketPosition(supplier2.address, vBnxToken.address, tx2);

    const vBnxMarket = await checkMarket(vBnxToken.address);
    expect(vBnxMarket?.supplierCount).to.equal('3');
  });

  it('should not update the supplier count on the market when partially redeeming', async function () {
    const btcb1000Usd = await oracle.getAssetTokenAmount(
      vBtcbToken.address,
      parseUnits('1000', 36),
    );
    const tx1 = await vBtcbToken.connect(supplier1).redeemUnderlying(btcb1000Usd.toString());
    await tx1.wait(1);
    const tx2 = await vBtcbToken.connect(supplier2).redeemUnderlying(btcb1000Usd.toString());
    await tx2.wait(1);

    await waitForSubgraphToBeSynced(syncDelay);

    checkMarketPosition(supplier1.address, vBtcbToken.address, tx1);
    checkMarketPosition(supplier1.address, vBtcbToken.address, tx2);

    const vBtcbMarket = await checkMarket(vBtcbToken.address);

    expect(vBtcbMarket?.supplierCount).to.equal('3');
  });

  it('should update the supplier count on the market when fully redeeming', async function () {
    const tx1 = await vBtcbToken
      .connect(supplier1)
      .redeem((await vBtcbToken.balanceOf(supplier1.address)).toString());
    await tx1.wait(1);
    const tx2 = await vBtcbToken
      .connect(supplier2)
      .redeem((await vBtcbToken.balanceOf(supplier2.address)).toString());
    await tx2.wait(1);

    await waitForSubgraphToBeSynced(syncDelay);

    checkMarketPosition(supplier1.address, vBtcbToken.address, tx1);
    checkMarketPosition(supplier1.address, vBtcbToken.address, tx2);

    const vBtcbMarket = await checkMarket(vBtcbToken.address);

    expect(vBtcbMarket?.supplierCount).to.equal('1');
  });

  it('should handle enter market', async function () {
    await comptroller.connect(borrower1).enterMarkets([vBnxToken.address, vBtcbToken.address]);
    await comptroller.connect(borrower2).enterMarkets([vBnxToken.address, vBtcbToken.address]);

    await waitForSubgraphToBeSynced(syncDelay);

    for (const vTokenAddress of [vBnxToken.address, vBtcbToken.address]) {
      const { marketPosition } = await subgraphClient.getMarketPositionByAccountAndMarket({
        marketId: vTokenAddress.toLowerCase(),
        accountId: borrower1.address,
      });
      expect(marketPosition?.enteredMarket).to.equal(true);
    }

    for (const vTokenAddress of [vBnxToken.address, vBtcbToken.address]) {
      const { marketPosition } = await subgraphClient.getMarketPositionByAccountAndMarket({
        marketId: vTokenAddress.toLowerCase(),
        accountId: borrower2.address,
      });
      expect(marketPosition?.enteredMarket).to.equal(true);
    }
  });

  it('should handle exit market', async function () {
    await comptroller.connect(borrower1).exitMarket(vBtcbToken.address);
    await comptroller.connect(borrower2).exitMarket(vBnxToken.address);

    await waitForSubgraphToBeSynced(syncDelay);

    const { marketPosition: marketPositionVUsdt } =
      await subgraphClient.getMarketPositionByAccountAndMarket({
        marketId: vBtcbToken.address.toLowerCase(),
        accountId: borrower1.address,
      });
    expect(marketPositionVUsdt?.enteredMarket).to.equal(false);

    const { marketPosition: marketPositionVDoge } =
      await subgraphClient.getMarketPositionByAccountAndMarket({
        marketId: vBnxToken.address.toLowerCase(),
        accountId: borrower2.address,
      });
    expect(marketPositionVDoge?.enteredMarket).to.equal(false);
  });

  it('should update the borrower count on the market for new borrows', async function () {
    const bnx1000Usd = await oracle.getAssetTokenAmount(vBnxToken.address, parseUnits('1000', 36));
    const btcb1000Usd = await oracle.getAssetTokenAmount(
      vBtcbToken.address,
      parseUnits('1000', 36),
    );
    await vBnxToken.connect(borrower1).mint(bnx1000Usd);
    await vBtcbToken.connect(borrower2).mint(btcb1000Usd);
    const { market: marketBeforeData } = await subgraphClient.getMarketById(
      vBnxAddress.toLowerCase(),
    );
    expect(marketBeforeData?.borrowerCount).to.equal('0');

    const bnx500Usd = await oracle.getAssetTokenAmount(vBnxToken.address, parseUnits('500', 36));
    const btcb500Usd = await oracle.getAssetTokenAmount(vBtcbToken.address, parseUnits('500', 36));

    const tx1 = await vBtcbToken.connect(borrower1).borrow(btcb500Usd);
    const tx2 = await vBnxToken.connect(borrower2).borrow(bnx500Usd);

    await waitForSubgraphToBeSynced(syncDelay);

    checkMarketPosition(borrower1.address, vBtcbToken.address, tx1);
    checkMarketPosition(borrower2.address, vBnxToken.address, tx2);

    const vBtcbMarket = await checkMarket(vBtcbToken.address);
    expect(vBtcbMarket?.borrowerCount).to.equal('1');

    const vBnxMarket = await checkMarket(vBnxToken.address);
    expect(vBnxMarket?.borrowerCount).to.equal('1');
  });

  it('should not update the borrower count on the market for repeated borrows', async function () {
    const btcb50Usd = await oracle.getAssetTokenAmount(vBtcbToken.address, parseUnits('50', 36));

    const bnx50Usd = await oracle.getAssetTokenAmount(vBnxToken.address, parseUnits('50', 36));

    const tx1 = await vBtcbToken.connect(borrower1).borrow(btcb50Usd.toString());
    const tx2 = await vBnxToken.connect(borrower2).borrow(bnx50Usd.toString());

    await waitForSubgraphToBeSynced(syncDelay);

    checkMarketPosition(borrower1.address, vBtcbToken.address, tx1);
    checkMarketPosition(borrower2.address, vBnxToken.address, tx2);

    const vBtcbMarket = await checkMarket(vBtcbToken.address);
    expect(vBtcbMarket?.borrowerCount).to.equal('1');

    const vBnxMarket = await checkMarket(vBnxToken.address);
    expect(vBnxMarket?.borrowerCount).to.equal('1');
  });

  it('should not update the borrower count on the market for partial repayment of borrow', async function () {
    const bnx10Usd = await oracle.getAssetTokenAmount(vBnxToken.address, parseUnits('10', 36));

    const tx1 = await vBnxToken.connect(borrower2).repayBorrow(bnx10Usd);

    await waitForSubgraphToBeSynced(syncDelay);

    checkMarketPosition(borrower1.address, vBtcbToken.address, tx1);

    const vBnxMarket = await checkMarket(vBnxToken.address);
    expect(vBnxMarket?.borrowerCount).to.equal('1');
  });

  it('should handle accrue interest event', async function () {
    for (const vToken of [vBtcbToken, vBnxToken]) {
      await vToken.accrueInterest();

      await waitForSubgraphToBeSynced(syncDelay);
      await checkMarket(vToken.address);
    }
  });

  it('should handle accrue interest event with added reserves', async function () {
    const btcb50Usd = await oracle.getAssetTokenAmount(vBtcbToken.address, parseUnits('50', 36));
    const bnx50Usd = await oracle.getAssetTokenAmount(vBnxToken.address, parseUnits('50', 36));
    for (const [vToken, amount] of [
      [vBtcbToken, btcb50Usd],
      [vBnxToken, bnx50Usd],
    ]) {
      await vToken.addReserves(amount.toString());

      await waitForSubgraphToBeSynced(syncDelay);

      await checkMarket(vToken.address);
    }
  });

  it('should handle liquidateBorrow event', async function () {
    await oracle.setPrice(vBtcbToken.address, parseUnits('30000', 18).toString());
    await oracle.setPrice(vBnxToken.address, parseUnits('.5', 18).toString());

    const liquidateAmount = await oracle.getAssetTokenAmount(
      vBtcbToken.address,
      parseUnits('10', 36),
    );
    const tx = await vBtcbToken
      .connect(liquidator1)
      .liquidateBorrow(borrower1.address, liquidateAmount.toString(), vBnxToken.address);

    await waitForSubgraphToBeSynced(syncDelay);

    checkMarketPosition(borrower1.address, vBnxToken.address, tx);

    await checkMarket(vBnxToken.address);

    const { account: accountBorrower } = await subgraphClient.getAccountById(
      borrower1.address.toLowerCase(),
    );
    expect(accountBorrower.countLiquidated).to.equal(1);

    const { account: accountLiquidator } = await subgraphClient.getAccountById(
      liquidator1.address.toLowerCase(),
    );
    expect(accountLiquidator.countLiquidator).to.equal(1);

    const vBnxMarket = await checkMarket(vBnxToken.address);
    // root, one borrower, 2suppliers, and liquidator added as suppliers
    expect(vBnxMarket?.supplierCount).to.equal('5');

    checkMarketPosition(liquidator1.address, vBnxToken.address, tx);
    // @todo check why repaying exact amount causes an overflow error
    // let borrowBalanceCurrent = await vBnxToken.borrowBalanceStored(borrower2.address);
    // await vBtcbToken.connect(borrower1).repayBorrow(borrowBalanceCurrent.sub(750000000000000));

    // await oracle.setPrice(vBtcbToken.address, parseUnits('100000', 18).toString());
    // await oracle.setPrice(vBnxToken.address, parseUnits('.2', 18).toString());

    // borrowBalanceCurrent = await vBtcbToken.callStatic.borrowBalanceCurrent(borrower1.address);

    // // liquidate rest of borrow
    // await comptroller.connect(liquidator1).liquidateAccount(borrower1.address, [
    //   {
    //     vTokenCollateral: vBnxToken.address,
    //     vTokenBorrowed: vBtcbToken.address,
    //     repayAmount: borrowBalanceCurrent.add(601),
    //   },
    // ]);

    // await waitForSubgraphToBeSynced(syncDelay);

    // const { market: vBtcbMarket } = await subgraphClient.getMarketById(
    //   vBtcbToken.address.toLowerCase(),
    // );
    // expect(vBtcbMarket!.borrowerCount).to.equal('0');

    // Reset prices
    await oracle.setPrice(vBnxToken.address, parseUnits('2', 18).toString());
    await oracle.setPrice(vBtcbToken.address, parseUnits('50000', 18).toString());
  });

  it('should update the borrower count on the market for full repayment of borrow', async function () {
    const tx = await vBnxToken
      .connect(borrower2)
      .repayBorrow((await vBnxToken.callStatic.borrowBalanceCurrent(borrower2.address)) + 20000n);

    await waitForSubgraphToBeSynced(syncDelay);

    checkMarketPosition(borrower2.address, vBnxToken.address, tx);

    const vBnxMarket = await checkMarket(vBnxToken.address);
    expect(vBnxMarket?.borrowerCount).to.equal('0');
  });

  it('should handle transfer event', async function () {
    for (const [supplier, vToken] of [
      [supplier1, vBtcbToken],
      [supplier2, vBnxToken],
    ] as [SignerWithAddress, Contract][]) {
      const supplierBalance = (await vToken.balanceOf(supplier.address)).div(2);

      const tx = await vToken
        .connect(supplier)
        .transfer(liquidator1.address, supplierBalance.toString());

      await waitForSubgraphToBeSynced(syncDelay);

      checkMarketPosition(supplier.address, vToken.address, tx);
      checkMarketPosition(liquidator1.address, vToken.address, tx);
    }
  });

  it('handles BadDebtIncreased event', async function () {
    const btcb1000Usd = await oracle.getAssetTokenAmount(
      vBtcbToken.address,
      parseUnits('10000', 36),
    );
    const bnx800Usd = await oracle.getAssetTokenAmount(vBnxToken.address, parseUnits('800', 36));
    // Borrower supplies BNX and borrows BTCB
    await vBtcbToken.connect(borrower2).mint(btcb1000Usd.toString());
    await vBnxToken.connect(borrower2).borrow(bnx800Usd.toString());

    // set lower price for collateral asset
    await oracle.setPrice(vBtcbToken.address, parseUnits('50', 10).toString());
    await oracle.setPrice(vBnxToken.address, parseUnits('160', 18).toString());

    const { market: marketBeforeUpdate } = await subgraphClient.getMarketById(
      vBnxAddress.toLowerCase(),
    );

    expect(marketBeforeUpdate?.badDebtMantissa).to.equal('0');

    const tx = await comptroller.connect(liquidator1).healAccount(borrower2.address);
    await tx.wait(1);
    await waitForSubgraphToBeSynced(4000);

    const { market } = await subgraphClient.getMarketById(vBnxAddress.toLowerCase());

    expect(market?.badDebtMantissa).to.equal((await vBnxToken.badDebt()).toString());

    const { marketPositions } = await subgraphClient.getMarketPositions({ first: 100, skip: 0 });

    const vBnxAccountTokens = marketPositions.find(
      avt =>
        avt.id.includes(borrower2.address.slice(2, 42).toLowerCase()) &&
        avt.market.id.toLowerCase() == vBnxToken.address.toLowerCase(),
    );
    expect(vBnxAccountTokens?.badDebt.length).to.be.equal(1);
    expect(vBnxAccountTokens?.badDebt[0].amountMantissa).to.be.equal(
      (await vBnxToken.badDebt()).toString(),
    );
  });

  it('handles ReservesAdded event', async function () {
    const vBtcbMarket = await checkMarket(vBtcbToken.address);

    const vTokenContract = await ethers.getContractAt('VToken', vBtcbAddress);
    const tx = await vTokenContract
      .connect(liquidator2)
      .addReserves(parseUnits('0.5', 18).toString());
    await tx.wait(1);
    await waitForSubgraphToBeSynced(syncDelay);

    const market = await checkMarket(vBtcbToken.address);
    // Interest is also accrued
    expect(market?.reservesMantissa).to.be.approximately(
      BigInt(vBtcbMarket?.reservesMantissa) + BigInt(parseUnits('0.5', 18).toString()),
      1e6,
    );
  });

  it('handles SpreadReservesReduced event', async function () {
    const vBtcbMarket = await checkMarket(vBtcbToken.address);

    const vTokenContract = await ethers.getContractAt('VToken', vBtcbAddress);

    const tx = await vTokenContract
      .connect(liquidator2)
      .reduceReserves(parseUnits('0.5', 18).toString());
    tx.wait(1);
    await waitForSubgraphToBeSynced(4000);

    const market = await checkMarket(vBtcbToken.address);

    expect(market?.reservesMantissa).to.be.approximately(
      BigInt(vBtcbMarket?.reservesMantissa) - BigInt(parseUnits('0.5', 18).toString()),
      1e6,
    );
  });
});
