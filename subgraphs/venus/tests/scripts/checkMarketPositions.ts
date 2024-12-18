import { providers } from '@0xsequence/multicall';
import VBep20Abi from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/VTokens/VBep20.sol/VBep20.json';
import assert from 'assert';
import { BigNumber, ethers } from 'ethers';

import createSubgraphClient from '../../subgraph-client';

const checkMarketPositions = async (
  provider: providers.MulticallProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  let skip = 0;
  while (skip >= 0) {
    console.log(`processed ${skip * 25}...`);
    const { marketPositions } = await subgraphClient.getMarketPositions({
      first: 25,
      skip: skip * 25,
    });
    for (const marketPosition of marketPositions) {
      const vTokenContract = new ethers.Contract(marketPosition.market.id, VBep20Abi.abi, provider);
      const accountBalance = await vTokenContract.balanceOf(marketPosition.account.id);
      try {
        assert.equal(
          marketPosition.vTokenBalanceMantissa,
          accountBalance.toString(),
          `incorrect supply balance for account ${marketPosition.account.id} in market ${MarketPosition.market.symbol} ${MarketPosition.market.id}. Subgraph Value: ${
            marketPosition.vTokenBalanceMantissa
          }, contractValue: ${accountBalance.toString()}`,
        );
      } catch (e) {
        console.log(e.message);
      }
      const borrowBalanceStored = await vTokenContract.borrowBalanceStored(
        marketPosition.account.id,
      );

      const updatedSubgraphValue = BigNumber.from(marketPosition.storedBorrowBalanceMantissa)
        .mul(marketPosition.market.borrowIndex)
        .div(marketPosition.borrowIndex)
        .toString();

      try {
        // borrower.borrowBalance * market.borrowIndex / borrower.borrowIndex
        assert.equal(
          updatedSubgraphValue,
          borrowBalanceStored.toString(),
          `
        incorrect borrow balance on account ${marketPosition.account.id} on market ${MarketPosition.market.symbol} ${MarketPosition.market.id}, accountBorrowIndex: ${MarketPosition.borrowIndex}, marketBorrowIndex ${MarketPosition.market.borrowIndex} subgraphValue: ${MarketPosition.storedBorrowBalanceMantissa} contractValue: ${borrowBalanceStored}`,
        );
      } catch (e) {
        console.log(e.message);
      }
    }
    if (marketPositions) {
      skip += 1;
    } else {
      skip = -1;
    }
  }
};

export default checkMarketPositions;
