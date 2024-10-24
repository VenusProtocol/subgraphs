import VBep20Abi from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/VTokens/VBep20.sol/VBep20.json';
import assert from 'assert';
import { BigNumber, ethers } from 'ethers';

import createSubgraphClient from '../../subgraph-client';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const subgraphClient = createSubgraphClient(process.env.SUBGRAPH_URL!);

const checkMarketSupplyAndBorrowTotals = async () => {
  const {
    data: { markets },
  } = await subgraphClient.getMarkets();
  for (const market of markets) {
    const vTokenContract = new ethers.Contract(market.id, VBep20Abi.abi, provider);
    const totalSupply = await vTokenContract.totalSupply();
    const totalBorrows = await vTokenContract.totalBorrows();
    // Check total market supply
    try {
      assert.equal(
        totalSupply.toString(),
        market.totalSupplyVTokenMantissa,
        `
      incorrect total supply market ${market.symbol} ${
          market.id
        } contract ${totalSupply.toString()} subgraph ${market.totalSupplyVTokenMantissa.toString()}`,
      );
      console.log(`correct supply for ${market.symbol}`);
    } catch (e) {
      console.log(e.message);
    }

    // Check total market borrows
    try {
      assert.equal(
        totalBorrows.toString(),
        market.totalBorrowsMantissa.toString(),
        `
    incorrect total borrow on market ${market.symbol} ${
          market.id
        } contract ${totalBorrows.toString()} subgraph ${market.totalBorrowsMantissa.toString()}`,
      );
      console.log(`correct borrow for ${market.symbol}`);
    } catch (e) {
      console.log(e.message);
    }
  }
};

const run = async () => {
  await checkMarketSupplyAndBorrowTotals();
  let skip = 0;
  while (skip <= 20) {
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
          .mul(accountVToken.market.borrowIndexMantissa)
          .div(accountVToken.borrowIndex)
          .toString();
        // borrower.borrowBalance * market.borrowIndex / borrower.borrowIndex
        assert.equal(
          updatedSubgraphValue,
          borrowBalanceStored.toString(),
          `
        incorrect borrow balance on account ${accountVToken.account.id} on market ${accountVToken.market.symbol} ${accountVToken.market.id}, accountBorrowIndex: ${accountVToken.borrowIndex}, marketBorrowIndex ${accountVToken.market.borrowIndexMantissa} subgraphValue: ${accountVToken.storedBorrowBalanceMantissa} contractValue: ${borrowBalanceStored}`,
        );
      } catch (e) {
        console.log(e.message);
      }
    }
    skip += 1;
  }
};

export default run();
