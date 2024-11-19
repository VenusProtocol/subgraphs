import { providers } from '@0xsequence/multicall';
import { abi as ResilientOracleAbi } from '@venusprotocol/oracle/artifacts/contracts/ResilientOracle.sol/ResilientOracle.json';
import { abi as ComptrollerAbi } from '@venusprotocol/venus-protocol/artifacts/contracts/Comptroller/Diamond/DiamondConsolidated.sol/DiamondConsolidated.json';
import { abi as Bep20Abi } from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/BEP20Interface.sol/BEP20Interface.json';
import { abi as VBep20Abi } from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/VTokens/VBep20.sol/VBep20.json';
import assert from 'assert';
import { BigNumber, ethers } from 'ethers';
import { assertEqual, tryCall } from 'venus-subgraph-utils';

import createSubgraphClient from '../../subgraph-client';

const { getAddress } = ethers.utils;

// const countAllBorrowers = async (subgraphClient: ReturnType<typeof createSubgraphClient>, marketId: string) => {
//   let total = 0
//   let skip = 0;
//   while (skip >= 0) {

//     const {
//       accountVTokens,
//     } = await subgraphClient.getAccountVTokensWithBorrowByMarketId({ first: 25, skip, marketId });
//     total += accountVTokens.length
//     skip += 1;
//     if (accountVTokens) {
//     } else {
//       skip = -1
//     }
//   }
//   return total
// }

const checkMarkets = async (
  provider: providers.MulticallProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  const {
    data: { markets },
  } = await subgraphClient.getMarkets();
  for (const market of markets) {
    const vTokenContract = new ethers.Contract(market.id, VBep20Abi, provider);
    const [comptrollerAddress, underlyingAddress] = await Promise.all([
      vTokenContract.comptroller(),
      tryCall(async () => await vTokenContract.underlying(), ''),
    ]);
    const comptrollerContract = new ethers.Contract(comptrollerAddress, ComptrollerAbi, provider);

    const underlyingContract = new ethers.Contract(underlyingAddress, Bep20Abi, provider);
    let underlyingName = 'BNB';
    let underlyingSymbol = 'BNB';
    let underlyingDecimals = 18;
    if (underlyingAddress) {
      [underlyingName, underlyingSymbol, underlyingDecimals] = await Promise.all([
        underlyingContract.name(),
        underlyingContract.symbol(),
        underlyingContract.decimals(),
      ]);
    }
    const [
      name,
      symbol,
      decimals,
      marketStorage,
      cashMantissa,
      exchangeRateMantissa,
      interestRateModelAddress,
      reservesMantissa,
      reserveFactorMantissa,
      borrowRateMantissa,
      supplyRateMantissa,
      totalSupply,
      totalBorrows,
    ] = await Promise.all([
      vTokenContract.name(),
      vTokenContract.symbol(),
      vTokenContract.decimals(),
      comptrollerContract.markets(market.id),
      vTokenContract.getCash(),
      vTokenContract.exchangeRateStored(),
      vTokenContract.interestRateModel(),
      vTokenContract.totalReserves(),
      vTokenContract.reserveFactorMantissa(),
      vTokenContract.borrowRatePerBlock(),
      vTokenContract.supplyRatePerBlock(),
      vTokenContract.totalSupply(),
      vTokenContract.totalBorrows(),
    ]);
    console.log(`Checking market ${market.id} ${market.symbol} ...`);
    const supplyState = await tryCall(
      async () => await comptrollerContract.venusSupplyState(market.id),
      { block: BigNumber.from(0), index: BigNumber.from(0) },
    );
    // const t1 = await comptrollerContract.venusSupplyState(market.id)
    const borrowState = await tryCall(
      async () => await comptrollerContract.venusBorrowState(market.id),
      { block: BigNumber.from(0), index: BigNumber.from(0) },
    );
    // const t2 = await comptrollerContract.venusBorrowState(market.id)

    const xvsSupplySpeeds = await tryCall(
      async () => await comptrollerContract.venusSupplySpeeds(market.id),
      BigNumber.from(0),
    );
    const xvsBorrowSpeeds = await await tryCall(
      async () => comptrollerContract.venusBorrowSpeeds(market.id),
      BigNumber.from(0),
    );

    const accrualBlockNumber = await vTokenContract.accrualBlockNumber();
    const borrowIndex = await vTokenContract.borrowIndex();
    const priceOracleAddress = await comptrollerContract.oracle();
    const priceOracleContract = new ethers.Contract(
      priceOracleAddress,
      ResilientOracleAbi,
      provider,
    );

    const underlyingPrice = await tryCall(
      async () =>
        await priceOracleContract.getUnderlyingPrice(market.id, {
          blockTag: +market.lastUnderlyingPriceBlockNumber,
        }),
      BigNumber.from(0),
    );
    assertEqual(market, name, 'name');
    assertEqual(market, symbol, 'symbol');
    assertEqual(market, decimals, 'vTokenDecimals');
    assertEqual(market, underlyingAddress, 'underlyingAddress', getAddress);
    assertEqual(market, underlyingName, 'underlyingName');
    assertEqual(market, underlyingSymbol, 'underlyingSymbol');
    assertEqual(market, underlyingDecimals, 'underlyingDecimals');

    assertEqual(market, marketStorage.isListed, 'isListed');
    assertEqual(market, marketStorage.collateralFactorMantissa, 'collateralFactorMantissa');
    assertEqual(market, borrowRateMantissa, 'borrowRateMantissa');
    assertEqual(market, supplyRateMantissa, 'supplyRateMantissa');
    assertEqual(market, cashMantissa, 'cashMantissa');
    assertEqual(market, exchangeRateMantissa, 'exchangeRateMantissa');
    assertEqual(market, interestRateModelAddress, 'interestRateModelAddress', getAddress);

    assertEqual(market, supplyState.block, 'xvsSupplyStateBlock');
    assertEqual(market, supplyState.index, 'xvsSupplyStateIndex');
    assertEqual(market, borrowState.block, 'xvsBorrowStateBlock');
    assertEqual(market, borrowState.index, 'xvsBorrowStateIndex');
    assertEqual(market, xvsSupplySpeeds, 'xvsSupplySpeed');
    assertEqual(market, xvsBorrowSpeeds, 'xvsBorrowSpeed');

    assertEqual(market, accrualBlockNumber, 'accrualBlockNumber');
    assertEqual(market, borrowIndex, 'borrowIndex');
    assertEqual(market, reservesMantissa, 'reservesMantissa');
    assertEqual(market, reserveFactorMantissa, 'reserveFactorMantissa');
    const bdFactor = 34 - underlyingDecimals;
    const underlyingPriceInCents = underlyingPrice.div(10n ** BigInt(bdFactor));
    assertEqual(market, underlyingPriceInCents, 'lastUnderlyingPriceCents');
    // 5640695722222.222
    // const bdFactor = exponentToBigInt(mantissaDecimalFactor);
    // const oracle2 = PriceOracle.bind(oracleAddress);
    // const oracleUnderlyingPrice = valueOrNotAvailableIntIfReverted(
    //   oracle2.try_getUnderlyingPrice(eventAddress),
    //   'PriceOracle try_getUnderlyingPrice',
    // );
    // if (oracleUnderlyingPrice.equals(BigInt.zero())) {
    //   return oracleUnderlyingPrice;
    // }

    // return underlyingPrice.times(BigInt.fromI32(100));
    // assertEqual(market, totalXvsDistributedMantissa, 'totalXvsDistributedMantissa')
    // const totalBorrowers = await countAllBorrowers(subgraphClient, market.id)
    // assertEqual(market, exchangeRateMantissa, 'supplierCount')
    // assertEqual(market, totalBorrowers, 'borrowerCount')

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
      // the first vUSDC total will fail because mint events start at 2804716 but the market is supported at block 2807477
      // https://testnet.bscscan.com/address/0xf3d05a25e4a019714a419f31c29963bddf53a19d
      // https://testnet.bscscan.com/tx/0x41fdbca8b257af8d3e9c8ad7c5daa45c9c64ba23885b118ddaf56386edb58529
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

export default checkMarkets;

// """
// Market stores all high level variables for a vToken market
// """
// type Market @entity {
//     "VToken address"
//     id: Bytes!
//     #Fields that match Venus API
//     "Flag indicating if the market is listed"
//     isListed: Boolean!
//     "Borrow rate per block"
//     borrowRateMantissa: BigInt!
//     "The vToken contract balance of BEP20 or BNB"
//     cashMantissa: BigInt!
//     "Collateral factor determining how much one can borrow"
//     collateralFactorMantissa: BigInt!
//     "Exchange rate of tokens / vTokens"
//     exchangeRateMantissa:  BigInt!
//     "Address of the interest rate model"
//     interestRateModelAddress: Bytes!
//     "Name of the vToken"
//     name: String!
//     "Reserves stored in the contract"
//     reservesMantissa: BigInt!
//     "Supply rate per block"
//     supplyRateMantissa: BigInt!
//     "VToken symbol"
//     symbol: String!
//     "Borrows in the market"
//     totalBorrowsMantissa: BigInt!
//     "Total vToken supplied"
//     totalSupplyVTokenMantissa: BigInt!
//     "Underlying token address"
//     underlyingAddress: Bytes!
//     "Underlying token name"
//     underlyingName: String!
//     "Underlying token symbol"
//     underlyingSymbol: String!
//     "XVS Supply Distribution Block"
//     xvsSupplyStateBlock:  BigInt!
//     "XVS Supply Distribution Index"
//     xvsSupplyStateIndex:  BigInt!
//     "XVS Reward Distribution Block"
//     xvsBorrowStateBlock:  BigInt!
//     "XVS Reward Distribution Index"
//     xvsBorrowStateIndex:  BigInt!

//     # Fields that are not in Venus api
//     "Block the market is updated to"
//     accrualBlockNumber: BigInt!
//     "Timestamp the market was most recently updated"
//     blockTimestamp: Int!
//     "The history of the markets borrow index return (Think S&P 500)"
//     borrowIndex: BigInt!
//     "The factor determining interest that goes to reserves"
//     reserveFactor: BigInt!
//     "Last recorded Underlying token price in USD cents"
//     lastUnderlyingPriceCents: BigInt!
//     "Block price was last updated"
//     lastUnderlyingPriceBlockNumber: BigInt!
//     "Underlying token decimal length"
//     underlyingDecimals: Int!
//     "Total XVS Distributed for this market"
//     totalXvsDistributedMantissa: BigInt!
//     "vToken decimal length"
//     vTokenDecimals: Int!

//     "Number of accounts currently supplying to this market"
//     supplierCount: BigInt

//     "Number of accounts currently borrowing from this market"
//     borrowerCount: BigInt!
// }

// """
// Account is an BNB address, with a list of all vToken markets the account has
// participated in, along with liquidation information.
// """
// type Account @entity {
//     "User BNB address"
//     id: Bytes!
//     "Array of VTokens user is in"
//     tokens: [AccountVToken!]! @derivedFrom(field: "account")
//     "Count user has been liquidated"
//     countLiquidated: Int!
//     "Count user has liquidated others"
//     countLiquidator: Int!
//     "True if user has ever borrowed"
//     hasBorrowed: Boolean!
// }

// """
// AccountVToken is a single account within a single vToken market, with data such
// as interest earned or paid
// """
// type AccountVToken @entity {
//     "Concatenation of VToken address and user address"
//     id: Bytes!
//     "Relation to market"
//     market: Market!
//     "Relation to user"
//     account: Account!
//     "Borrow Index this position last accrued interest"
//     borrowIndex: BigInt!
//     "True if user is entered, false if they are exited"
//     enteredMarket: Boolean!
//     "VToken balance of the user"
//     vTokenBalanceMantissa: BigInt!
//     "Total amount of underlying redeemed"
//     totalUnderlyingRedeemedMantissa: BigInt!
//     "Total amount underlying repaid"
//     totalUnderlyingRepaidMantissa: BigInt!
//     "Stored borrow balance stored in contract (exclusive of interest since accrualBlockNumber)"
//     storedBorrowBalanceMantissa: BigInt!
// }

// enum EventType {
//     MINT
//     MINT_BEHALF
//     REDEEM
//     BORROW
//     TRANSFER
//     LIQUIDATE
//     REPAY
// }

// """
// An interface for a transfer of any vToken. TransferEvent, MintEvent,
// RedeemEvent, and LiquidationEvent all use this interface
// """
// type Transaction @entity {
//     "Transaction hash concatenated with log index"
//     id: Bytes!
//     "enum of event type"
//     type: EventType!
//     "The account that sent the tokens, usually vToken"
//     from: Bytes!
//     "count of vTokens transferred"
//     amountMantissa: BigInt!
//     "Account that received tokens"
//     to: Bytes!
//     "Block number"
//     blockNumber: Int!
//     "Block time"
//     blockTime: Int!
// }
