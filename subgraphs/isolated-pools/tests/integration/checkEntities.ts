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
  const { marketPositions: marketPositionsSupply } =
    await subgraphClient.getMarketPositionsWithSupplyByMarketId(marketAddress.toLowerCase(), 0);
  const { marketPositions: marketPositionsBorrow } =
    await subgraphClient.getMarketPositionsWithBorrowByMarketId(marketAddress.toLowerCase(), 0);
  const { market } = await subgraphClient.getMarketById(marketAddress.toLowerCase());
  expect(market?.supplierCount).to.equal(marketPositionsSupply.length.toString());
  expect(market?.borrowerCount).to.equal(marketPositionsBorrow.length.toString());

  expect(market?.totalBorrowsMantissa).to.equal(await vToken.totalBorrows());
  expect(market?.totalSupplyVTokenMantissa).to.equal(await vToken.totalSupply());

  expect(market?.borrowIndex).to.equal(await vToken.borrowIndex());
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
  expect(getAddress(market?.underlyingToken.address)).to.equal(await vToken.underlying());
  expect(market?.borrowCapMantissa).to.equal(await comptroller.borrowCaps(marketAddress));
  expect(market?.supplyCapMantissa).to.equal(await comptroller.supplyCaps(marketAddress));
  expect(market?.accrualBlockNumber).to.equal(await vToken.accrualBlockNumber());
  expect(market?.borrowIndex).to.equal((await vToken.borrowIndex()).toString());
  expect(market?.reserveFactorMantissa).to.equal(await vToken?.reserveFactorMantissa());
  return market;
};

export const checkMarketPosition = async (
  accountAddress: string,
  marketAddress: string,
  transaction: TransactionResponse,
) => {
  const vToken = await ethers.getContractAt('VToken', marketAddress);

  const { marketPosition } = await subgraphClient.getMarketPositionByAccountAndMarket({
    accountId: accountAddress.toLowerCase(),
    marketId: marketAddress.toLowerCase(),
  });
  expect(marketPosition!.accrualBlockNumber).to.equal(transaction.blockNumber);
  expect(marketPosition!.vTokenBalanceMantissa).to.equal(await vToken.balanceOf(accountAddress));
  expect(marketPosition!.storedBorrowBalanceMantissa).to.equal(
    await vToken.borrowBalanceStored(accountAddress),
  );
  expect(marketPosition!.borrowIndex).to.equal(await vToken.borrowIndex());
  expect(marketPosition!.enteredMarket).to.equal(await vToken.checkMembership(accountAddress));
};
