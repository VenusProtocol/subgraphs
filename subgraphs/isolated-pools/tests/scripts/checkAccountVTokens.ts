import { providers } from '@0xsequence/multicall';
import VBep20Abi from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/VTokens/VBep20.sol/VBep20.json';
import assert from 'assert';
import { BigNumber, ethers } from 'ethers';

import createSubgraphClient from '../../subgraph-client';

const checkAccountVTokens = async (
  provider: providers.MulticallProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  let page = 0;
  const skip = 100;
  while (page >= 0) {
    const { accountVTokens } = await subgraphClient.getAccountVTokens({
      first: skip,
      skip: skip * page,
    });

    await Promise.all(
      accountVTokens.map(async accountVToken => {
        const vTokenContract = new ethers.Contract(
          accountVToken.market.id,
          VBep20Abi.abi,
          provider,
        );
        const accountBalance = await vTokenContract.balanceOf(accountVToken.account.id);
        const borrowBalanceStored = await vTokenContract.borrowBalanceStored(
          accountVToken.account.id,
        );
        try {
          assert.equal(
            accountVToken.vTokenBalanceMantissa,
            accountBalance.toString(),
            `incorrect supply balance for account ${accountVToken.account.id} in market ${
              accountVToken.market.symbol
            } ${accountVToken.market.id}. Subgraph Value: ${
              accountVToken.vTokenBalanceMantissa
            }, contractValue: ${accountBalance.toString()}`,
          );
        } catch (e) {
          console.log(e.message);
        }

        try {
          const updatedSubgraphValue = BigNumber.from(accountVToken.storedBorrowBalanceMantissa)
            .mul(accountVToken.market.borrowIndex)
            .div(accountVToken.borrowIndex)
            .toString();
          // borrower.borrowBalance * market.borrowIndex / borrower.borrowIndex
          assert.equal(
            updatedSubgraphValue,
            borrowBalanceStored.toString(),
            `
        incorrect borrow balance on account ${accountVToken.account.id} on market ${accountVToken.market.symbol} ${accountVToken.market.id}, accountBorrowIndex: ${accountVToken.borrowIndex}, marketBorrowIndex ${accountVToken.market.borrowIndex} subgraphValue: ${updatedSubgraphValue} contractValue: ${borrowBalanceStored}`,
          );
        } catch (e) {
          console.log(e.message);
        }
      }),
    );
    console.log(`processed ${skip * (page + 1)}...`);
    if (accountVTokens.length == 0) {
      page = -1;
    } else {
      page += 1;
    }
  }
};

export default checkAccountVTokens;
