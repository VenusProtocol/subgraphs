import { providers } from '@0xsequence/multicall';
import VBep20Abi from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/VTokens/VBep20.sol/VBep20.json';
import assert from 'assert';
import { BigNumber, ethers } from 'ethers';

import createSubgraphClient from '../../subgraph-client';

const checkMarketPositions = async (
  provider: providers.MulticallProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  let page = 0;
  const skip = 100;
  while (page >= 0) {
    const { marketPositions } = await subgraphClient.getMarketPositions({
      first: skip,
      skip: skip * page,
    });

    await Promise.all(
      marketPositions.map(async marketPosition => {
        const vTokenContract = new ethers.Contract(
          marketPosition.market.id,
          VBep20Abi.abi,
          provider,
        );
        const accountBalance = await vTokenContract.balanceOf(marketPosition.account.id);
        const borrowBalanceStored = await vTokenContract.borrowBalanceStored(
          marketPosition.account.id,
        );
        try {
          assert.equal(
            marketPosition.vTokenBalanceMantissa,
            accountBalance.toString(),
            `incorrect supply balance for account ${marketPosition.account.id} in market ${
              marketPosition.market.symbol
            } ${marketPosition.market.id}. Subgraph Value: ${
              marketPosition.vTokenBalanceMantissa
            }, contractValue: ${accountBalance.toString()}`,
          );
        } catch (e) {
          console.log(e.message);
        }

        try {
          const updatedSubgraphValue = BigNumber.from(marketPosition.storedBorrowBalanceMantissa)
            .mul(marketPosition.market.borrowIndex)
            .div(marketPosition.borrowIndex)
            .toString();
          // borrower.borrowBalance * market.borrowIndex / borrower.borrowIndex
          assert.equal(
            updatedSubgraphValue,
            borrowBalanceStored.toString(),
            `
        incorrect borrow balance on account ${marketPosition.account.id} on market ${marketPosition.market.symbol} ${marketPosition.market.id}, accountBorrowIndex: ${marketPosition.borrowIndex}, marketBorrowIndex ${marketPosition.market.borrowIndex} subgraphValue: ${updatedSubgraphValue} contractValue: ${borrowBalanceStored}`,
          );
        } catch (e) {
          console.log(e.message);
        }
      }),
    );
    console.log(`processed ${skip * (page + 1)}...`);
    if (marketPositions.length == 0) {
      page = -1;
    } else {
      page += 1;
    }
  }
};

export default checkMarketPositions;
