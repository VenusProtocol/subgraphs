import { TransactionResponse } from '@ethersproject/abstract-provider';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import createSubgraphClient from '../../subgraph-client';

const { getAddress } = ethers.utils;

const subgraphClient = createSubgraphClient(
  'http://graph-node:8000/subgraphs/name/venusprotocol/venus-isolated-pools',
);

export const checkMarket = async (marketAddress: string) => {
  const vToken = await ethers.getContractAt('VToken', marketAddress);
  const comptroller = await ethers.getContractAt('Comptroller', await vToken.comptroller());
  const { accountVTokens: accountVTokensSupply } =
    await subgraphClient.getAccountVTokensWithSupplyByMarketId(marketAddress.toLowerCase());
  const { accountVTokens: accountVTokensBorrow } =
    await subgraphClient.getAccountVTokensWithBorrowByMarketId(marketAddress.toLowerCase());
  const { market } = await subgraphClient.getMarketById(marketAddress.toLowerCase());
  expect(market?.supplierCount).to.equal(accountVTokensSupply.length.toString());
  expect(market?.borrowerCount).to.equal(accountVTokensBorrow.length.toString());

  expect(market?.totalBorrowsMantissa).to.equal(await vToken.totalBorrows());
  expect(market?.totalSupplyVTokenMantissa).to.equal(await vToken.totalSupply());

  expect(market?.borrowIndexMantissa).to.equal(await vToken.borrowIndex());
  expect(market?.borrowRateMantissa).to.equal(await vToken.borrowRatePerBlock());
  expect(market?.supplyRateMantissa).to.equal(await vToken.supplyRatePerBlock());

  expect(market?.cashMantissa).to.equal(await vToken.getCash());
  expect(market?.reservesMantissa).to.equal(await vToken.totalReserves());
  expect(getAddress(market?.pool.id)).to.equal(await vToken.comptroller());
  expect(market?.isListed).to.equal((await comptroller.markets(marketAddress)).isListed);
  expect(market?.collateralFactorMantissa).to.equal(
    (await comptroller.markets(marketAddress)).collateralFactorMantissa,
  );
  expect(market?.exchangeRateMantissa).to.equal(await vToken.exchangeRateStored());
  expect(getAddress(market?.interestRateModelAddress)).to.equal(await vToken.interestRateModel());
  expect(market?.name).to.equal(await vToken.name());
  expect(market?.reservesMantissa).to.equal(await vToken.totalReserves());
  expect(market?.supplyRateMantissa).to.equal(await vToken.supplyRatePerBlock());
  expect(market?.symbol).to.equal(await vToken.symbol());
  expect(getAddress(market?.underlyingAddress)).to.equal(await vToken.underlying());
  expect(market?.borrowCapMantissa).to.equal(await comptroller.borrowCaps(marketAddress));
  expect(market?.supplyCapMantissa).to.equal(await comptroller.supplyCaps(marketAddress));
  expect(market?.accrualBlockNumber).to.equal(await vToken.accrualBlockNumber());
  expect(market?.borrowIndexMantissa).to.equal((await vToken.borrowIndex()).toString());
  expect(market?.reserveFactorMantissa).to.equal(await vToken?.reserveFactorMantissa());
  return market;
};

export const checkAccountVToken = async (
  accountAddress: string,
  marketAddress: string,
  transaction: TransactionResponse,
) => {
  const vToken = await ethers.getContractAt('VToken', marketAddress);

  const { accountVToken } = await subgraphClient.getAccountVTokenByAccountAndMarket({
    accountId: accountAddress.toLowerCase(),
    marketId: marketAddress.toLowerCase(),
  });
  expect(accountVToken!.accrualBlockNumber).to.equal(transaction.blockNumber);
  expect(accountVToken!.vTokenBalanceMantissa).to.equal(await vToken.balanceOf(accountAddress));
  expect(accountVToken!.storedBorrowBalanceMantissa).to.equal(
    await vToken.borrowBalanceStored(accountAddress),
  );
  expect(accountVToken!.borrowIndex).to.equal(await vToken.borrowIndex());
  expect(accountVToken!.enteredMarket).to.equal(await vToken.checkMembership(accountAddress));
};
