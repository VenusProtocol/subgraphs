import { TransactionResponse } from '@ethersproject/abstract-provider';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import subgraphClient from '../../subgraph-client';

export const checkMarket = async (marketAddress: string) => {
  const vToken = await ethers.getContractAt('VToken', marketAddress);
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
