import { JsonRpcSigner } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import hre, { ethers } from 'hardhat';
import { waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import createSubgraphClient from '../../subgraph-client';

const { parseUnits, formatUnits } = ethers.utils;
const { MaxUint256 } = ethers.constants;

const subgraphClient = createSubgraphClient(
  'http://graph-node:8000/subgraphs/name/venusprotocol/venus-subgraph',
);

const checkSupply = async (account: string, vToken: Contract) => {
  const {
    data: { accountVToken },
  } = await subgraphClient.getAccountVTokenByAccountAndMarket({
    marketId: vToken.address.toLowerCase(),
    accountId: account,
  });
  const accountContractBalance = await vToken.balanceOf(account);

  expect(accountVToken?.vTokenBalanceMantissa || '0').to.equal(accountContractBalance.toString());
  // on market
  const accrualBlockNumber = await vToken.accrualBlockNumber();
  const {
    data: { market },
  } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
  expect(market?.accrualBlockNumber.toString()).to.equal(accrualBlockNumber.toString());
};

const checkBorrows = async (account: string, vToken: Contract) => {
  const {
    data: { accountVToken },
  } = await subgraphClient.getAccountVTokenByAccountAndMarket({
    marketId: vToken.address.toLowerCase(),
    accountId: account,
  });
  const accountContractBalance = await vToken.borrowBalanceStored(account);
  const borrowIndex = await vToken.borrowIndex();
  expect(accountVToken?.storedBorrowBalanceMantissa || '0').to.equal(
    accountContractBalance.toString(),
  );
  expect(accountVToken?.borrowIndex || '0').to.equal(borrowIndex);
  expect(accountVToken.account.hasBorrowed).to.equal(true);
  // on market
  const accrualBlockNumber = await vToken.accrualBlockNumber();
  const {
    data: { market },
  } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
  expect(market?.accrualBlockNumber.toString()).to.equal(accrualBlockNumber.toString());
  expect(market?.borrowIndex.toString()).to.equal(borrowIndex.toString());
};

describe('VToken events', function () {
  const syncDelay = 2000;
  let rootSigner: JsonRpcSigner;
  let supplier1Signer: JsonRpcSigner;
  let supplier2Signer: JsonRpcSigner;
  let supplier3Signer: JsonRpcSigner;
  let borrower1Signer: JsonRpcSigner;
  let borrower2Signer: JsonRpcSigner;
  let borrower3Signer: JsonRpcSigner;
  let liquidator1Signer: JsonRpcSigner;
  let liquidator2Signer: JsonRpcSigner;
  let liquidator3Signer: JsonRpcSigner;
  let suppliers: JsonRpcSigner[];
  let borrowers: JsonRpcSigner[];
  let comptroller: Contract;
  // R1 Interface
  let vUsdcToken: Contract;
  let vWBnbToken: Contract;
  let vEthToken: Contract;
  // Current Interface
  let vDogeToken: Contract;
  let vFdusdToken: Contract;
  let vUsdtToken: Contract;
  let oracle: Contract;

  before(async function () {
    const {
      deployer: root,
      supplier1,
      supplier2,
      supplier3,
      borrower1,
      borrower2,
      borrower3,
      liquidator1,
      liquidator2,
      liquidator3,
    } = await hre.getNamedAccounts();

    rootSigner = ethers.provider.getSigner(root);
    supplier1Signer = ethers.provider.getSigner(supplier1);
    supplier2Signer = ethers.provider.getSigner(supplier2);
    supplier3Signer = ethers.provider.getSigner(supplier3);

    borrower1Signer = ethers.provider.getSigner(borrower1);
    borrower2Signer = ethers.provider.getSigner(borrower2);
    borrower3Signer = ethers.provider.getSigner(borrower3);

    liquidator1Signer = ethers.provider.getSigner(liquidator1);
    liquidator2Signer = ethers.provider.getSigner(liquidator2);
    liquidator3Signer = ethers.provider.getSigner(liquidator3);

    suppliers = [supplier1Signer, supplier2Signer, supplier3Signer];
    borrowers = [borrower1Signer, borrower2Signer, borrower3Signer];

    const fundAccounts = async (token: Contract, amount: string) => {
      const underlying = await token.underlying();
      const underlyingContract = await ethers.getContractAt('BEP20Harness', underlying);
      await Promise.all(
        [
          supplier1Signer,
          supplier2Signer,
          supplier3Signer,
          borrower1Signer,
          borrower2Signer,
          borrower3Signer,
          liquidator1Signer,
          liquidator2Signer,
          liquidator3Signer,
        ].map(async account => {
          await underlyingContract.connect(account).faucet(amount);
          await underlyingContract.connect(account).approve(token.address, MaxUint256);
          await underlyingContract.connect(rootSigner).faucet(amount);
          await underlyingContract.connect(rootSigner).approve(token.address, MaxUint256);
        }),
      );
    };

    comptroller = await ethers.getContract('Unitroller');
    // Original Tokens
    vUsdcToken = await ethers.getContract('vUSDC');
    vWBnbToken = await ethers.getContract('vBNB');
    vEthToken = await ethers.getContract('vETH');

    vDogeToken = await ethers.getContract('vDOGE');
    vFdusdToken = await ethers.getContract('vFDUSD');
    vUsdtToken = await ethers.getContract('vUSDT');

    // Set Prices
    oracle = await ethers.getContract('MockPriceOracleUnderlyingPrice');
    // USDC $1
    await oracle.setPrice(vUsdcToken.address, parseUnits('1', 18).toString());
    // BNB $500
    await oracle.setPrice(vWBnbToken.address, parseUnits('500', 18).toString());
    // ETH $5000
    await oracle.setPrice(vEthToken.address, parseUnits('5000', 18).toString());

    // USDC $1
    await oracle.setPrice(vFdusdToken.address, parseUnits('1', 18).toString());
    // DOGE $.5
    await oracle.setPrice(vDogeToken.address, parseUnits('.5', 18).toString());
    // USDT $1
    await oracle.setPrice(vUsdtToken.address, parseUnits('1', 18).toString());

    await comptroller._setCloseFactor(parseUnits('0.1'));

    await comptroller._setMarketSupplyCaps(
      [
        vUsdcToken.address,
        vWBnbToken.address,
        vEthToken.address,
        vFdusdToken.address,
        vUsdtToken.address,
        vDogeToken.address,
      ],
      [
        parseUnits('500000'),
        parseUnits('500'),
        parseUnits('500'),
        parseUnits('500000'),
        parseUnits('500000'),
        parseUnits('5000000000000'),
      ],
    );

    await comptroller._setMarketBorrowCaps(
      [
        vUsdcToken.address,
        vWBnbToken.address,
        vEthToken.address,
        vFdusdToken.address,
        vUsdtToken.address,
        vDogeToken.address,
      ],
      [
        parseUnits('500000'),
        parseUnits('500'),
        parseUnits('500'),
        parseUnits('500000'),
        parseUnits('500000'),
        parseUnits('5000000000000'),
      ],
    );

    await comptroller._setCollateralFactor(vFdusdToken.address, parseUnits('0.9'));
    await comptroller._setCollateralFactor(vUsdtToken.address, parseUnits('0.9'));
    await comptroller._setCollateralFactor(vDogeToken.address, parseUnits('0.9'));
    await comptroller._setCollateralFactor(vUsdcToken.address, parseUnits('0.9'));
    await comptroller._setCollateralFactor(vWBnbToken.address, parseUnits('0.9'));
    await comptroller._setCollateralFactor(vEthToken.address, parseUnits('0.9'));

    await Promise.all(
      (
        [
          [vUsdcToken, parseUnits('100000', 18).toString()],
          [vWBnbToken, parseUnits('100000', 18).toString()],
          [vEthToken, parseUnits('100000', 18).toString()],
          [vFdusdToken, parseUnits('100000', 18).toString()],
          [vDogeToken, parseUnits('1000000000', 18).toString()],
          [vUsdtToken, parseUnits('100000', 18).toString()],
        ] as [Contract, string][]
      ).map(async data => {
        await fundAccounts(data[0], data[1]);
      }),
    );

    await waitForSubgraphToBeSynced(syncDelay);
  });

  describe('Original VToken events', () => {
    it('should update correctly when minting', async function () {
      // Supply all accounts
      const fdusd1000Usd = await oracle.getAssetTokenAmount(
        vFdusdToken.address,
        parseUnits('1000', 36),
      );
      const usdt2000Usd = await oracle.getAssetTokenAmount(
        vUsdtToken.address,
        parseUnits('2000', 36),
      );
      const doge1000Usd = await oracle.getAssetTokenAmount(
        vDogeToken.address,
        parseUnits('1000', 36),
      );

      for (const account of suppliers) {
        await vDogeToken.connect(account).mint(doge1000Usd.toString());
        await vFdusdToken.connect(account).mint(fdusd1000Usd.toString());
        await vUsdtToken.connect(account).mint(usdt2000Usd.toString());
      }

      await waitForSubgraphToBeSynced(syncDelay);

      for (const account of suppliers) {
        for (const vToken of [vFdusdToken, vUsdtToken, vDogeToken]) {
          await checkSupply(account._address, vToken);
          const {
            data: { market },
          } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
          expect(market?.supplierCount).to.equal('3');
          expect(market?.totalSupplyVTokenMantissa).to.equal(await vToken.totalSupply());
          const supplyState = await comptroller.venusSupplyState(vToken.address);
          expect(market?.xvsSupplyStateIndex).to.equal(supplyState.index.toString());
          expect(market?.xvsSupplyStateBlock).to.equal(supplyState.block.toString());
        }
      }

      for (const account of borrowers) {
        await vFdusdToken.connect(rootSigner).mintBehalf(account._address, fdusd1000Usd.toString());
        await vDogeToken.connect(rootSigner).mintBehalf(account._address, doge1000Usd.toString());
      }

      await waitForSubgraphToBeSynced(syncDelay);

      for (const account of borrowers) {
        for (const vToken of [vFdusdToken, vDogeToken]) {
          await checkSupply(account._address, vToken);
          const {
            data: { market },
          } = await subgraphClient.getMarketById(vToken.address.toLowerCase());

          expect(market?.supplierCount).to.equal('6');
          expect(market?.totalSupplyVTokenMantissa).to.equal(await vToken.totalSupply());
          const supplyState = await comptroller.venusSupplyState(vToken.address);
          expect(market?.xvsSupplyStateIndex).to.equal(supplyState.index.toString());
          expect(market?.xvsSupplyStateBlock).to.equal(supplyState.block.toString());
        }
      }
    });

    it('should not update correctly when mint again', async function () {
      // Supply all accounts
      const fdusd100Usd = await oracle.getAssetTokenAmount(
        vFdusdToken.address,
        parseUnits('100', 36),
      );
      const usdt100Usd = await oracle.getAssetTokenAmount(
        vUsdtToken.address,
        parseUnits('100', 36),
      );
      const doge500Usd = await oracle.getAssetTokenAmount(
        vDogeToken.address,
        parseUnits('500', 36),
      );

      for (const account of suppliers) {
        await vFdusdToken.connect(account).mint(fdusd100Usd.toString());
        await vUsdtToken.connect(account).mint(usdt100Usd.toString());
        await vDogeToken.connect(account).mint(doge500Usd.toString());
      }

      await waitForSubgraphToBeSynced(syncDelay);

      for (const account of suppliers) {
        for (const vToken of [vFdusdToken, vDogeToken]) {
          await checkSupply(account._address, vToken);
          const {
            data: { market },
          } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
          expect(market?.supplierCount).to.equal('6');
        }
        await checkSupply(account._address, vUsdtToken);
        const {
          data: { market },
        } = await subgraphClient.getMarketById(vUsdtToken.address.toLowerCase());
        expect(market?.supplierCount).to.equal('3');
      }

      for (const account of borrowers) {
        await vFdusdToken.connect(rootSigner).mintBehalf(account._address, fdusd100Usd.toString());
        await vDogeToken.connect(rootSigner).mintBehalf(account._address, doge500Usd.toString());
      }

      await waitForSubgraphToBeSynced(syncDelay);

      for (const account of borrowers) {
        for (const vToken of [vFdusdToken, vDogeToken]) {
          await checkSupply(account._address, vToken);
          const {
            data: { market },
          } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
          expect(market?.supplierCount).to.equal('6');
        }
      }
    });

    it('should not update the supplier count on the market when partially redeeming', async function () {
      for (const vToken of [vFdusdToken, vDogeToken]) {
        const redeemAmount = (await vToken.balanceOf(supplier2Signer._address)).div(2);

        const exchangeRate = await vToken.callStatic.exchangeRateCurrent();

        await vToken.connect(supplier2Signer).redeem(redeemAmount.toString());

        await waitForSubgraphToBeSynced(syncDelay);

        await checkSupply(supplier2Signer._address, vToken);

        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
        expect(market?.supplierCount).to.equal('6');
        expect(market?.totalSupplyVTokenMantissa).to.equal(await vToken.totalSupply());
        const supplyState = await comptroller.venusSupplyState(vToken.address);
        expect(market?.xvsSupplyStateIndex).to.equal(supplyState.index.toString());
        expect(market?.xvsSupplyStateBlock).to.equal(supplyState.block.toString());
        const {
          data: { accountVToken },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vToken.address.toLowerCase(),
          accountId: supplier2Signer._address,
        });
        expect(accountVToken.totalUnderlyingRedeemedMantissa).to.equal(
          formatUnits(redeemAmount.mul(exchangeRate), 18).split('.')[0],
        ); // remove decimals
      }
    });

    it('should update the supplier count on the market when fully redeemed', async function () {
      for (const vToken of [vFdusdToken, vDogeToken]) {
        const redeemAmount = await vToken.balanceOf(supplier2Signer._address);
        await vToken.connect(supplier2Signer).redeem(redeemAmount.toString());

        await waitForSubgraphToBeSynced(syncDelay);

        await checkSupply(supplier2Signer._address, vToken);
        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
        expect(market?.supplierCount).to.equal('5');
        const supplyState = await comptroller.venusSupplyState(vToken.address);
        expect(market?.xvsSupplyStateIndex).to.equal(supplyState.index.toString());
        expect(market?.xvsSupplyStateBlock).to.equal(supplyState.block.toString());
      }
    });

    it('should handle enter market', async function () {
      await comptroller
        .connect(borrower1Signer)
        .enterMarkets([vFdusdToken.address, vUsdtToken.address, vDogeToken.address]);
      await comptroller
        .connect(borrower2Signer)
        .enterMarkets([vFdusdToken.address, vUsdtToken.address, vDogeToken.address]);
      await comptroller
        .connect(borrower3Signer)
        .enterMarkets([vFdusdToken.address, vUsdtToken.address, vDogeToken.address]);

      await waitForSubgraphToBeSynced(syncDelay);

      for (const vTokenAddress of [vFdusdToken.address, vUsdtToken.address, vDogeToken.address]) {
        const {
          data: { accountVToken },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vTokenAddress.toLowerCase(),
          accountId: borrower1Signer._address,
        });
        expect(accountVToken?.enteredMarket).to.equal(true);
      }

      for (const vTokenAddress of [vFdusdToken.address, vUsdtToken.address, vDogeToken.address]) {
        const {
          data: { accountVToken },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vTokenAddress.toLowerCase(),
          accountId: borrower2Signer._address,
        });
        expect(accountVToken?.enteredMarket).to.equal(true);
      }

      for (const vTokenAddress of [vFdusdToken.address, vUsdtToken.address, vDogeToken.address]) {
        const {
          data: { accountVToken },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vTokenAddress.toLowerCase(),
          accountId: borrower3Signer._address,
        });
        expect(accountVToken?.enteredMarket).to.equal(true);
      }
    });

    it('should handle exit market', async function () {
      await comptroller.connect(borrower1Signer).exitMarket(vUsdtToken.address);
      await comptroller.connect(borrower2Signer).exitMarket(vDogeToken.address);
      await comptroller.connect(borrower3Signer).exitMarket(vFdusdToken.address);

      await waitForSubgraphToBeSynced(syncDelay);

      const {
        data: { accountVToken: accountVTokenVUsdt },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vUsdtToken.address.toLowerCase(),
        accountId: borrower1Signer._address,
      });
      expect(accountVTokenVUsdt?.enteredMarket).to.equal(false);

      const {
        data: { accountVToken: accountVTokenVDoge },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vDogeToken.address.toLowerCase(),
        accountId: borrower2Signer._address,
      });
      expect(accountVTokenVDoge?.enteredMarket).to.equal(false);

      const {
        data: { accountVToken: accountVTokenVFusd },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vFdusdToken.address.toLowerCase(),
        accountId: borrower3Signer._address,
      });
      expect(accountVTokenVFusd?.enteredMarket).to.equal(false);
    });

    it('should update the borrower count on the market for new borrows', async function () {
      const doge1250Usd = await oracle.getAssetTokenAmount(
        vDogeToken.address,
        parseUnits('1250', 36),
      );
      const usdt50Usd = await oracle.getAssetTokenAmount(vUsdtToken.address, parseUnits('50', 36));
      const fdusd50Usd = await oracle.getAssetTokenAmount(
        vFdusdToken.address,
        parseUnits('50', 36),
      );
      await vUsdtToken.connect(borrower1Signer).borrow(usdt50Usd);
      await vDogeToken.connect(borrower2Signer).borrow(doge1250Usd);
      await vFdusdToken.connect(borrower3Signer).borrow(fdusd50Usd);

      await waitForSubgraphToBeSynced(syncDelay);

      await checkBorrows(borrower1Signer._address, vDogeToken);
      await checkBorrows(borrower1Signer._address, vUsdtToken);
      await checkBorrows(borrower1Signer._address, vFdusdToken);

      for (const vToken of [vFdusdToken, vUsdtToken, vDogeToken]) {
        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
        expect(market?.borrowerCount).to.equal('1');
        expect(market?.totalBorrowsMantissa).to.equal((await vToken.totalBorrows()).toString());

        const borrowState = await comptroller.venusBorrowState(vToken.address);
        expect(market?.xvsBorrowStateIndex).to.equal(borrowState.index.toString());
        expect(market?.xvsBorrowStateBlock).to.equal(borrowState.block.toString());
      }
    });

    it('should not update the borrower count on the market for repeated borrows', async function () {
      const doge1070Usd = await oracle.getAssetTokenAmount(
        vDogeToken.address,
        parseUnits('1070', 36),
      );

      await vDogeToken.connect(borrower2Signer).borrow(doge1070Usd);

      await waitForSubgraphToBeSynced(syncDelay);

      await checkBorrows(borrower2Signer._address, vDogeToken);

      const {
        data: { market },
      } = await subgraphClient.getMarketById(vDogeToken.address.toLowerCase());
      expect(market?.borrowerCount).to.equal('1');
      expect(market?.totalBorrowsMantissa).to.equal((await vDogeToken.totalBorrows()).toString());
      const borrowState = await comptroller.venusBorrowState(vDogeToken.address);
      expect(market?.xvsBorrowStateIndex).to.equal(borrowState.index.toString());
      expect(market?.xvsBorrowStateBlock).to.equal(borrowState.block.toString());
    });

    it('should not update the borrower count on the market for partial repayment of borrow', async function () {
      const doge20Usd = await oracle.getAssetTokenAmount(vDogeToken.address, parseUnits('20', 36));
      await vDogeToken.connect(borrower2Signer).repayBorrow(doge20Usd);

      await waitForSubgraphToBeSynced(syncDelay);

      await checkBorrows(borrower2Signer._address, vDogeToken);

      const {
        data: { market },
      } = await subgraphClient.getMarketById(vDogeToken.address.toLowerCase());
      expect(market?.borrowerCount).to.equal('1');
      expect(market?.totalBorrowsMantissa).to.equal((await vDogeToken.totalBorrows()).toString());

      const {
        data: { accountVToken },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vDogeToken.address.toLowerCase(),
        accountId: borrower2Signer._address,
      });
      expect(accountVToken.totalUnderlyingRepaidMantissa).to.equal(doge20Usd.toString());
    });

    it('should handle accrue interest event', async function () {
      for (const vToken of [vFdusdToken, vDogeToken]) {
        const prevAccrualBlockNumber = await vToken.accrualBlockNumber();
        const prevBorrowIndex = await vToken.borrowIndex();
        const prevTotalBorrows = await vToken.totalBorrows();
        const prevCash = await vToken.getCash();
        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
        await vToken.accrueInterest();

        await waitForSubgraphToBeSynced(syncDelay);
        expect(market.accrualBlockNumber).to.be.greaterThanOrEqual(prevAccrualBlockNumber);
        expect(market.borrowIndex).to.be.greaterThanOrEqual(prevBorrowIndex);
        expect(market.totalBorrowsMantissa).to.greaterThanOrEqual(prevTotalBorrows);
        expect(market.cashMantissa).to.lessThanOrEqual(prevCash);
      }
    });

    it('should handle accrue interest event with added reserves', async function () {
      const fdusd50Usd = await oracle.getAssetTokenAmount(
        vFdusdToken.address,
        parseUnits('10', 36),
      );
      const doge50Usd = await oracle.getAssetTokenAmount(vDogeToken.address, parseUnits('50', 36));
      for (const [vToken, amount] of [
        [vFdusdToken, fdusd50Usd],
        [vDogeToken, doge50Usd],
      ]) {
        const borrowRateMantissaPrev = await vToken.borrowRatePerBlock();
        const exchangeRateMantissaPrev = await vToken.callStatic.exchangeRateCurrent();
        const supplyRateMantissaPrev = await vToken.supplyRatePerBlock();

        await vToken._addReserves(amount.toString());

        await waitForSubgraphToBeSynced(syncDelay);

        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());

        expect(market.reservesMantissa).to.equal(amount);
        expect(market.borrowRateMantissa).to.be.greaterThanOrEqual(borrowRateMantissaPrev);
        expect(market.exchangeRateMantissa).to.be.greaterThanOrEqual(exchangeRateMantissaPrev);
        expect(market.supplyRateMantissa).to.be.greaterThanOrEqual(supplyRateMantissaPrev);
      }
    });

    it('should handle liquidateBorrow event', async function () {
      await oracle.setPrice(vDogeToken.address, parseUnits('500', 18).toString());
      await oracle.setPrice(vFdusdToken.address, parseUnits('0.9', 18).toString());

      const doge10Usd = await oracle.getAssetTokenAmount(vDogeToken.address, parseUnits('10', 36));

      await vDogeToken
        .connect(liquidator1Signer)
        .liquidateBorrow(borrower2Signer._address, doge10Usd.toString(), vFdusdToken.address);

      await waitForSubgraphToBeSynced(syncDelay);

      const {
        data: { accountVToken },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vDogeToken.address.toLowerCase(),
        accountId: borrower2Signer._address,
      });

      const {
        data: { market },
      } = await subgraphClient.getMarketById(vDogeToken.address.toLowerCase());

      const borrowState = await comptroller.venusBorrowState(vDogeToken.address);
      expect(market?.xvsBorrowStateIndex).to.equal(borrowState.index.toString());
      expect(market?.xvsBorrowStateBlock).to.equal(borrowState.block.toString());

      expect(accountVToken.storedBorrowBalanceMantissa).to.be.approximately(
        ethers.BigNumber.from(
          await vDogeToken.callStatic.borrowBalanceCurrent(borrower2Signer._address),
        ),
        1e11,
      );
      expect(accountVToken?.borrowIndex || '0').to.equal(await vDogeToken.borrowIndex());

      const {
        data: { account: accountBorrower },
      } = await subgraphClient.getAccountById(borrower2Signer._address);
      expect(accountBorrower.countLiquidated).to.equal(1);

      const {
        data: { account: accountLiquidator },
      } = await subgraphClient.getAccountById(liquidator1Signer._address);
      expect(accountLiquidator.countLiquidator).to.equal(1);

      // Counts liquidator as borrower
      const {
        data: { market: marketUpdated },
      } = await subgraphClient.getMarketById(vFdusdToken.address.toLowerCase());
      expect(marketUpdated?.supplierCount).to.equal('6');

      const { data: liquidatorAccountVTokenData } =
        await subgraphClient.getAccountVTokenByAccountAndMarket({
          accountId: liquidator1Signer._address.toLowerCase(),
          marketId: vFdusdToken.address.toLowerCase(),
        });
      const { accountVToken: liquidatorAccountVToken } = liquidatorAccountVTokenData!;

      expect(liquidatorAccountVToken.vTokenBalanceMantissa).to.be.approximately(
        ethers.BigNumber.from(await vFdusdToken.balanceOf(liquidator1Signer._address)),
        1e11,
      );

      // Reset prices
      await oracle.setPrice(vFdusdToken.address, parseUnits('1', 18).toString());
      await oracle.setPrice(vDogeToken.address, parseUnits('.5', 18).toString());
    });

    it('should update the borrower count on the market for full repayment of borrow', async function () {
      const {
        data: { accountVToken: accountVTokenPrev },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vDogeToken.address.toLowerCase(),
        accountId: borrower2Signer._address,
      });
      const borrowBalance = await vDogeToken.callStatic.borrowBalanceCurrent(
        borrower2Signer._address,
      );

      const repayAmount = borrowBalance.add(9225884015468);
      await vDogeToken.connect(borrower2Signer).repayBorrow(repayAmount.toString());

      await waitForSubgraphToBeSynced(syncDelay);

      await checkBorrows(borrower2Signer._address, vDogeToken);

      const {
        data: { market },
      } = await subgraphClient.getMarketById(vDogeToken.address.toLowerCase());
      expect(await vDogeToken.callStatic.borrowBalanceCurrent(borrower2Signer._address)).to.equal(
        0,
      );
      expect(market?.borrowerCountAdjusted).to.equal('0');
      expect(market?.borrowerCount).to.equal('0');
      expect(market?.totalBorrowsMantissa).to.equal((await vDogeToken.totalBorrows()).toString());
      const borrowState = await comptroller.venusBorrowState(vDogeToken.address);
      expect(market?.xvsBorrowStateIndex).to.equal(borrowState.index.toString());
      expect(market?.xvsBorrowStateBlock).to.equal(borrowState.block.toString());

      const {
        data: { accountVToken },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vDogeToken.address.toLowerCase(),
        accountId: borrower2Signer._address,
      });
      expect(accountVToken.totalUnderlyingRepaidMantissa).to.be.approximately(
        ethers.BigNumber.from(accountVTokenPrev.totalUnderlyingRepaidMantissa).add(repayAmount),
        1e10,
      );
    });

    it('should handle transfer event', async function () {
      for (const [supplier, vToken] of [
        [supplier1Signer, vFdusdToken],
        [supplier2Signer, vUsdtToken],
        [supplier3Signer, vDogeToken],
      ]) {
        const supplierBalance = (await vToken.balanceOf(supplier._address)).div(2);
        const liquidatorBalance = await vToken.balanceOf(liquidator1Signer._address);

        await vToken
          .connect(supplier)
          .transfer(liquidator1Signer._address, supplierBalance.toString());

        await waitForSubgraphToBeSynced(syncDelay);

        const {
          data: { accountVToken },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vToken.address.toLowerCase(),
          accountId: supplier._address,
        });

        expect(accountVToken.vTokenBalanceMantissa).to.equal(supplierBalance.toString());

        const {
          data: { accountVToken: accountVTokenLiquidator },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vToken.address.toLowerCase(),
          accountId: liquidator1Signer._address,
        });
        expect(accountVTokenLiquidator.vTokenBalanceMantissa).to.equal(
          liquidatorBalance.add(supplierBalance).toString(),
        );

        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());

        const supplyState = await comptroller.venusSupplyState(vToken.address);
        expect(market?.xvsSupplyStateIndex).to.equal(supplyState.index.toString());
        expect(market?.xvsSupplyStateBlock).to.equal(supplyState.block.toString());
      }
    });
  });

  describe('Updated VToken events', () => {
    it('should update the supplier count on the market when new minting', async function () {
      // Supply all accounts
      const usdc1000Usd = await oracle.getAssetTokenAmount(
        vUsdcToken.address,
        parseUnits('1000', 36),
      );
      const bnb1000Usd = await oracle.getAssetTokenAmount(
        vWBnbToken.address,
        parseUnits('1000', 36),
      );
      const eth2000Usd = await oracle.getAssetTokenAmount(
        vEthToken.address,
        parseUnits('2000', 36),
      );

      for (const account of suppliers) {
        await vUsdcToken.connect(account).mint(usdc1000Usd.toString());
        await vWBnbToken.connect(account).mint({ value: bnb1000Usd.toString() });
        await vEthToken.connect(account).mint(eth2000Usd.toString());
      }

      await waitForSubgraphToBeSynced(syncDelay);

      for (const account of suppliers) {
        for (const vToken of [vUsdcToken, vWBnbToken, vEthToken]) {
          await checkSupply(account._address, vToken);
          const {
            data: { market },
          } = await subgraphClient.getMarketById(vToken.address.toLowerCase());

          expect(market?.supplierCount).to.equal('3');
          expect(market?.totalSupplyVTokenMantissa).to.equal(await vToken.totalSupply());
          const supplyState = await comptroller.venusSupplyState(vToken.address);
          expect(market?.xvsSupplyStateIndex).to.equal(supplyState.index.toString());
          expect(market?.xvsSupplyStateBlock).to.equal(supplyState.block.toString());
        }
      }

      for (const account of borrowers) {
        await vUsdcToken.connect(rootSigner).mintBehalf(account._address, usdc1000Usd.toString());
        await vEthToken.connect(rootSigner).mintBehalf(account._address, eth2000Usd.toString());
      }

      await waitForSubgraphToBeSynced(syncDelay);

      for (const account of borrowers) {
        for (const vToken of [vUsdcToken, vEthToken]) {
          await checkSupply(account._address, vToken);
          const {
            data: { market },
          } = await subgraphClient.getMarketById(vToken.address.toLowerCase());

          expect(market?.supplierCount).to.equal('6');
          expect(market?.totalSupplyVTokenMantissa).to.equal(await vToken.totalSupply());
        }
      }
    });

    it('should not update the supplier count on the market when current accounts mint again', async function () {
      // Supply all accounts
      const usdc100Usd = await oracle.getAssetTokenAmount(
        vUsdcToken.address,
        parseUnits('1000', 36),
      );
      const bnb1000Usd = await oracle.getAssetTokenAmount(
        vWBnbToken.address,
        parseUnits('1000', 36),
      );
      const eth2000Usd = await oracle.getAssetTokenAmount(
        vEthToken.address,
        parseUnits('2000', 36),
      );

      for (const account of suppliers) {
        await vUsdcToken.connect(account).mint(usdc100Usd.toString());
        await vWBnbToken.connect(account).mint({ value: bnb1000Usd.toString() });
        await vEthToken.connect(account).mint(eth2000Usd.toString());
      }

      await waitForSubgraphToBeSynced(syncDelay);

      for (const account of suppliers) {
        for (const vToken of [vUsdcToken, vEthToken]) {
          await checkSupply(account._address, vToken);
          const {
            data: { market },
          } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
          expect(market?.supplierCount).to.equal('6');
        }
        await checkSupply(account._address, vWBnbToken);
        const {
          data: { market },
        } = await subgraphClient.getMarketById(vWBnbToken.address.toLowerCase());
        expect(market?.supplierCount).to.equal('3');
      }

      for (const account of borrowers) {
        await vUsdcToken.connect(rootSigner).mintBehalf(account._address, usdc100Usd.toString());
        await vEthToken.connect(rootSigner).mintBehalf(account._address, eth2000Usd.toString());
      }

      await waitForSubgraphToBeSynced(syncDelay);

      for (const account of borrowers) {
        for (const vToken of [vUsdcToken, vEthToken]) {
          await checkSupply(account._address, vToken);
          const {
            data: { market },
          } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
          expect(market?.supplierCount).to.equal('6');
        }
      }
    });

    it('should not update the supplier count on the market when partially redeeming', async function () {
      for (const vToken of [vUsdcToken, vEthToken]) {
        const redeemAmount = (await vToken.balanceOf(supplier2Signer._address)).div(2);
        const exchangeRate = await vToken.callStatic.exchangeRateCurrent();
        await vToken.connect(supplier2Signer).redeem(redeemAmount.toString());

        await waitForSubgraphToBeSynced(syncDelay);

        await checkSupply(supplier2Signer._address, vToken);
        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
        expect(market?.supplierCount).to.equal('6');
        expect(market?.totalSupplyVTokenMantissa).to.equal(await vToken.totalSupply());
        const supplyState = await comptroller.venusSupplyState(vToken.address);
        expect(market?.xvsSupplyStateIndex).to.equal(supplyState.index.toString());
        expect(market?.xvsSupplyStateBlock).to.equal(supplyState.block.toString());
        const {
          data: { accountVToken },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vToken.address.toLowerCase(),
          accountId: supplier2Signer._address,
        });
        expect(accountVToken.totalUnderlyingRedeemedMantissa).to.equal(
          formatUnits(redeemAmount.mul(exchangeRate), 18).split('.')[0],
        ); // remove decimals
      }
    });

    it('should update the supplier count on the market when fully redeemed', async function () {
      for (const vToken of [vUsdcToken, vEthToken]) {
        const redeemAmount = await vToken.balanceOf(supplier2Signer._address);
        await vToken.connect(supplier2Signer).redeem(redeemAmount.toString());

        await waitForSubgraphToBeSynced(syncDelay);

        await checkSupply(supplier2Signer._address, vToken);
        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
        expect(market?.supplierCount).to.equal('5');
      }
    });

    it('should handle enter market', async function () {
      await comptroller
        .connect(borrower1Signer)
        .enterMarkets([vUsdcToken.address, vWBnbToken.address, vEthToken.address]);
      await comptroller
        .connect(borrower2Signer)
        .enterMarkets([vUsdcToken.address, vWBnbToken.address, vEthToken.address]);
      await comptroller
        .connect(borrower3Signer)
        .enterMarkets([vUsdcToken.address, vWBnbToken.address, vEthToken.address]);

      await waitForSubgraphToBeSynced(syncDelay);

      for (const vTokenAddress of [vUsdcToken.address, vWBnbToken.address, vEthToken.address]) {
        const {
          data: { accountVToken },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vTokenAddress.toLowerCase(),
          accountId: borrower1Signer._address,
        });
        expect(accountVToken?.enteredMarket).to.equal(true);
      }

      for (const vTokenAddress of [vUsdcToken.address, vWBnbToken.address, vEthToken.address]) {
        const {
          data: { accountVToken },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vTokenAddress.toLowerCase(),
          accountId: borrower2Signer._address,
        });
        expect(accountVToken?.enteredMarket).to.equal(true);
      }

      for (const vTokenAddress of [vUsdcToken.address, vWBnbToken.address, vEthToken.address]) {
        const {
          data: { accountVToken },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vTokenAddress.toLowerCase(),
          accountId: borrower3Signer._address,
        });
        expect(accountVToken?.enteredMarket).to.equal(true);
      }
    });

    it('should handle exit market', async function () {
      await comptroller.connect(borrower1Signer).exitMarket(vWBnbToken.address);
      await comptroller.connect(borrower2Signer).exitMarket(vEthToken.address);
      await comptroller.connect(borrower3Signer).exitMarket(vUsdcToken.address);

      await waitForSubgraphToBeSynced(syncDelay);

      const {
        data: { accountVToken: accountVTokenVWbnb },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vWBnbToken.address.toLowerCase(),
        accountId: borrower1Signer._address,
      });
      expect(accountVTokenVWbnb?.enteredMarket).to.equal(false);

      const {
        data: { accountVToken: accountVTokenVEth },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vEthToken.address.toLowerCase(),
        accountId: borrower2Signer._address,
      });
      expect(accountVTokenVEth?.enteredMarket).to.equal(false);

      const {
        data: { accountVToken: accountVTokenVUsdc },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vUsdcToken.address.toLowerCase(),
        accountId: borrower3Signer._address,
      });
      expect(accountVTokenVUsdc?.enteredMarket).to.equal(false);
    });

    it('should update the borrower count on the market for new borrows', async function () {
      const eth3000Usd = await oracle.getAssetTokenAmount(
        vEthToken.address,
        parseUnits('3000', 36),
      );

      const bnb500Usd = await oracle.getAssetTokenAmount(vWBnbToken.address, parseUnits('500', 36));
      const usdc500Usd = await oracle.getAssetTokenAmount(
        vUsdcToken.address,
        parseUnits('500', 36),
      );

      await vEthToken.connect(borrower1Signer).borrow(eth3000Usd);
      await vWBnbToken.connect(borrower2Signer).borrow(bnb500Usd);
      await vUsdcToken.connect(borrower3Signer).borrow(usdc500Usd);

      await waitForSubgraphToBeSynced(syncDelay);

      await checkBorrows(borrower1Signer._address, vEthToken);
      await checkBorrows(borrower1Signer._address, vWBnbToken);
      await checkBorrows(borrower1Signer._address, vUsdcToken);

      for (const vToken of [vUsdcToken, vWBnbToken, vEthToken]) {
        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
        expect(market?.borrowerCount).to.equal('1');
        expect(market?.totalBorrowsMantissa).to.equal((await vToken.totalBorrows()).toString());
        const borrowState = await comptroller.venusBorrowState(vToken.address);
        expect(market?.xvsBorrowStateIndex).to.equal(borrowState.index.toString());
        expect(market?.xvsBorrowStateBlock).to.equal(borrowState.block.toString());
      }
    });

    it('should not update the borrower count on the market for repeated borrows', async function () {
      const eth2010Usd = await oracle.getAssetTokenAmount(
        vEthToken.address,
        parseUnits('2010', 36),
      );

      await vEthToken.connect(borrower1Signer).borrow(eth2010Usd);

      await waitForSubgraphToBeSynced(syncDelay);

      await checkBorrows(borrower1Signer._address, vEthToken);

      const {
        data: { market },
      } = await subgraphClient.getMarketById(vEthToken.address.toLowerCase());
      expect(market?.borrowerCount).to.equal('1');
      expect(market?.totalBorrowsMantissa).to.equal((await vEthToken.totalBorrows()).toString());
      const borrowState = await comptroller.venusBorrowState(vEthToken.address);
      expect(market?.xvsBorrowStateIndex).to.equal(borrowState.index.toString());
      expect(market?.xvsBorrowStateBlock).to.equal(borrowState.block.toString());
    });

    it('should not update the borrower count on the market for partial repayment of borrow', async function () {
      const eth20Usd = await oracle.getAssetTokenAmount(vEthToken.address, parseUnits('20', 36));
      await vEthToken.connect(borrower1Signer).repayBorrow(eth20Usd);

      await waitForSubgraphToBeSynced(syncDelay);

      await checkBorrows(borrower1Signer._address, vEthToken);

      const {
        data: { market },
      } = await subgraphClient.getMarketById(vEthToken.address.toLowerCase());
      expect(market?.borrowerCount).to.equal('1');
      expect(market?.totalBorrowsMantissa).to.equal((await vEthToken.totalBorrows()).toString());
      const borrowState = await comptroller.venusBorrowState(vEthToken.address);
      expect(market?.xvsBorrowStateIndex).to.equal(borrowState.index.toString());
      expect(market?.xvsBorrowStateBlock).to.equal(borrowState.block.toString());

      const {
        data: { accountVToken },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vEthToken.address.toLowerCase(),
        accountId: borrower1Signer._address,
      });
      expect(accountVToken.totalUnderlyingRepaidMantissa).to.equal(eth20Usd.toString());
    });

    it('should handle accrue interest event', async function () {
      for (const vToken of [vUsdcToken, vEthToken]) {
        const prevAccrualBlockNumber = await vToken.accrualBlockNumber();
        const prevBorrowIndex = await vToken.borrowIndex();
        const prevTotalBorrows = await vToken.totalBorrows();
        const prevCash = await vToken.getCash();
        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());
        await vToken.accrueInterest();

        await waitForSubgraphToBeSynced(syncDelay);
        expect(market.accrualBlockNumber).to.be.greaterThanOrEqual(prevAccrualBlockNumber);
        expect(market.borrowIndex).to.be.greaterThanOrEqual(prevBorrowIndex);
        expect(market.totalBorrowsMantissa).to.greaterThanOrEqual(prevTotalBorrows);
        expect(market.cashMantissa).to.lessThanOrEqual(prevCash);
      }
    });

    it('should handle accrue interest event with added reserves', async function () {
      const usdc10Usd = await oracle.getAssetTokenAmount(vUsdcToken.address, parseUnits('10', 36));
      const eth50Usd = await oracle.getAssetTokenAmount(vEthToken.address, parseUnits('50', 36));
      for (const [vToken, amount] of [
        [vUsdcToken, usdc10Usd],
        [vEthToken, eth50Usd],
      ]) {
        const borrowRateMantissaPrev = await vToken.borrowRatePerBlock();
        const exchangeRateMantissaPrev = await vToken.callStatic.exchangeRateCurrent();
        const supplyRateMantissaPrev = await vToken.supplyRatePerBlock();

        await vToken._addReserves(amount.toString());

        await waitForSubgraphToBeSynced(syncDelay);

        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());

        expect(market.reservesMantissa).to.equal(amount);
        expect(market.borrowRateMantissa).to.be.greaterThanOrEqual(borrowRateMantissaPrev);
        expect(market.exchangeRateMantissa).to.be.greaterThanOrEqual(exchangeRateMantissaPrev);
        expect(market.supplyRateMantissa).to.be.greaterThanOrEqual(supplyRateMantissaPrev);
      }
    });

    it('should handle liquidateBorrow event', async function () {
      await oracle.setPrice(vEthToken.address, parseUnits('50000', 18).toString());
      await oracle.setPrice(vUsdcToken.address, parseUnits('0.9', 18).toString());
      const eth200Usd = await oracle.getAssetTokenAmount(vEthToken.address, parseUnits('200', 36));
      await vEthToken
        .connect(liquidator1Signer)
        .liquidateBorrow(borrower1Signer._address, eth200Usd.toString(), vUsdcToken.address);
      await waitForSubgraphToBeSynced(syncDelay);

      const {
        data: { accountVToken },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vEthToken.address.toLowerCase(),
        accountId: borrower1Signer._address,
      });

      expect(accountVToken.storedBorrowBalanceMantissa).to.be.approximately(
        ethers.BigNumber.from(
          await vEthToken.callStatic.borrowBalanceCurrent(borrower1Signer._address),
        ),
        1e11,
      );
      expect(accountVToken?.borrowIndex || '0').to.equal(await vEthToken.borrowIndex());

      const {
        data: { account: accountBorrower },
      } = await subgraphClient.getAccountById(borrower1Signer._address);
      expect(accountBorrower.countLiquidated).to.equal(1);

      const {
        data: { account: accountLiquidator },
      } = await subgraphClient.getAccountById(liquidator1Signer._address);
      expect(accountLiquidator.countLiquidator).to.equal(2);

      const {
        data: { market },
      } = await subgraphClient.getMarketById(vEthToken.address.toLowerCase());
      const borrowState = await comptroller.venusBorrowState(vEthToken.address);
      expect(market?.xvsBorrowStateIndex).to.equal(borrowState.index.toString());
      expect(market?.xvsBorrowStateBlock).to.equal(borrowState.block.toString());

      // Reset prices
      await oracle.setPrice(vEthToken.address, parseUnits('5000', 18).toString());
      await oracle.setPrice(vUsdcToken.address, parseUnits('1', 18).toString());
    });

    it('should update the borrower count on the market for full repayment of borrow', async function () {
      const {
        data: { accountVToken: accountVTokenPrev },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vEthToken.address.toLowerCase(),
        accountId: borrower1Signer._address,
      });
      const borrowBalance = await vEthToken.callStatic.borrowBalanceCurrent(
        borrower1Signer._address,
      );

      const repayAmount = borrowBalance.add(1174890622);

      await vEthToken.connect(borrower1Signer).repayBorrow(repayAmount.toString());

      await waitForSubgraphToBeSynced(syncDelay);

      await checkBorrows(borrower1Signer._address, vEthToken);

      const {
        data: { market },
      } = await subgraphClient.getMarketById(vEthToken.address.toLowerCase());
      expect(
        await vEthToken.callStatic.borrowBalanceCurrent(borrower1Signer._address),
      ).to.be.lessThanOrEqual(10);
      expect(market?.borrowerCountAdjusted).to.equal('0');
      expect(+market?.borrowerCount).to.be.lessThanOrEqual(1);
      expect(market?.totalBorrowsMantissa).to.equal((await vEthToken.totalBorrows()).toString());
      const borrowState = await comptroller.venusBorrowState(vEthToken.address);
      expect(market?.xvsBorrowStateIndex).to.equal(borrowState.index.toString());
      expect(market?.xvsBorrowStateBlock).to.equal(borrowState.block.toString());

      const {
        data: { accountVToken },
      } = await subgraphClient.getAccountVTokenByAccountAndMarket({
        marketId: vEthToken.address.toLowerCase(),
        accountId: borrower1Signer._address,
      });
      expect(accountVToken.totalUnderlyingRepaidMantissa).to.be.approximately(
        ethers.BigNumber.from(accountVTokenPrev.totalUnderlyingRepaidMantissa).add(repayAmount),
        1e10,
      );
    });

    it('should handle transfer event', async function () {
      for (const [supplier, vToken] of [
        [supplier1Signer, vUsdcToken],
        [supplier2Signer, vWBnbToken],
        [supplier3Signer, vEthToken],
      ]) {
        const supplierBalance = (await vToken.balanceOf(supplier._address)).div(2);
        const liquidatorBalance = await vToken.balanceOf(liquidator1Signer._address);

        await vToken
          .connect(supplier)
          .transfer(liquidator1Signer._address, supplierBalance.toString());

        await waitForSubgraphToBeSynced(syncDelay);

        const {
          data: { market },
        } = await subgraphClient.getMarketById(vToken.address.toLowerCase());

        const supplyState = await comptroller.venusSupplyState(vToken.address);
        expect(market?.xvsSupplyStateIndex).to.equal(supplyState.index.toString());
        expect(market?.xvsSupplyStateBlock).to.equal(supplyState.block.toString());

        const {
          data: { accountVToken },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vToken.address.toLowerCase(),
          accountId: supplier._address,
        });

        expect(accountVToken.vTokenBalanceMantissa).to.equal(supplierBalance.toString());

        const {
          data: { accountVToken: accountVTokenLiquidator },
        } = await subgraphClient.getAccountVTokenByAccountAndMarket({
          marketId: vToken.address.toLowerCase(),
          accountId: liquidator1Signer._address,
        });
        expect(accountVTokenLiquidator.vTokenBalanceMantissa).to.equal(
          liquidatorBalance.add(supplierBalance).toString(),
        );
      }
    });
  });
});
