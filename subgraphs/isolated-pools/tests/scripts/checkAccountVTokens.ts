import VBep20Abi from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/VTokens/VBep20.sol/VBep20.json';
import assert from 'assert';
import { BigNumber, ethers } from 'ethers';

import createSubgraphClient from '../../subgraph-client';

const checkAccountVTokens = async (
  provider: ethers.providers.JsonRpcProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  let skip = 0;
  while (skip >= 0) {
    console.log(`processed ${skip * 25}...`);
    const { accountVTokens } = await subgraphClient.getAccountVTokens({
      first: 25,
      skip: skip * 25,
    });
    for (const accountVToken of accountVTokens) {
      const vTokenContract = new ethers.Contract(accountVToken.market.id, VBep20Abi.abi, provider);
      const accountBalance = await vTokenContract.balanceOf(accountVToken.account.id);
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
      const borrowBalanceStored = await vTokenContract.borrowBalanceStored(
        accountVToken.account.id,
      );

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
    }
    if (accountVTokens) {
      skip += 1;
    } else {
      skip = -1;
    }
  }
};

export default checkAccountVTokens;
