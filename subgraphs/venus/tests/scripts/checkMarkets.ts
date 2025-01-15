import { providers } from '@0xsequence/multicall';
import { abi as ResilientOracleAbi } from '@venusprotocol/oracle/artifacts/contracts/ResilientOracle.sol/ResilientOracle.json';
import { abi as ComptrollerAbi } from '@venusprotocol/venus-protocol/artifacts/contracts/Comptroller/Diamond/DiamondConsolidated.sol/DiamondConsolidated.json';
import { abi as Bep20Abi } from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/BEP20Interface.sol/BEP20Interface.json';
import { abi as VBep20Abi } from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/VTokens/VBep20.sol/VBep20.json';
import assert from 'assert';
import { BigNumber, ethers } from 'ethers';
import { assertEqual, tryCall } from '@venusprotocol/subgraph-utils';

import createSubgraphClient from '../../subgraph-client';

const { getAddress } = ethers.utils;

const sleep = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const countSuppliers = async (
  subgraphClient: ReturnType<typeof createSubgraphClient>,
  marketAddress: string,
) => {
  let supplierCount = 0;
  let page = 0;
  while (page >= 0 && page <= 50) {
    const { marketPositions } = await subgraphClient.getMarketPositionsWithSupplyByMarketId({
      marketId: marketAddress,
      page,
    });
    supplierCount += marketPositions.length;

    if (marketPositions.length == 0) {
      page = -1;
    } else {
      page += 1;
      await sleep(1000);
    }
  }
  return supplierCount;
};

const countBorrower = async (
  subgraphClient: ReturnType<typeof createSubgraphClient>,
  marketAddress: string,
) => {
  let borrowerCount = 0;
  let page = 0;
  while (page >= 0 && page <= 50) {
    const { marketPositions } = await subgraphClient.getMarketPositionsWithBorrowByMarketId({
      marketId: marketAddress,
      page,
    });

    borrowerCount += marketPositions.length;

    if (marketPositions.length == 0) {
      page = -1;
    } else {
      page += 1;
      await sleep(1000);
    }
  }
  return borrowerCount;
};
const checkMarkets = async (
  provider: providers.MulticallProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  const { markets } = await subgraphClient.getMarkets();
  for (const market of markets) {
    const vTokenContract = new ethers.Contract(market.address, VBep20Abi, provider);
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
      comptrollerContract.markets(market.address),
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

    const supplyState = await tryCall(
      async () => await comptrollerContract.venusSupplyState(market.address),
      { block: BigNumber.from(0), index: BigNumber.from(0) },
    );

    const borrowState = await tryCall(
      async () => await comptrollerContract.venusBorrowState(market.address),
      { block: BigNumber.from(0), index: BigNumber.from(0) },
    );

    const xvsSupplySpeeds = await tryCall(
      async () => await comptrollerContract.venusSupplySpeeds(market.address),
      BigNumber.from(0),
    );
    const xvsBorrowSpeeds = await await tryCall(
      async () => comptrollerContract.venusBorrowSpeeds(market.address),
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
        await priceOracleContract.getUnderlyingPrice(market.address, {
          blockTag: +market.lastUnderlyingPriceBlockNumber,
        }),
      BigNumber.from(0),
    );
    assertEqual(market, name, 'name');
    assertEqual(market, symbol, 'symbol');
    assertEqual(market, decimals, 'vTokenDecimals');
    assertEqual(market.underlyingToken, underlyingAddress, 'address', getAddress);
    assertEqual(market.underlyingToken, underlyingName, 'name');
    assertEqual(market.underlyingToken, underlyingSymbol, 'symbol');
    assertEqual(market.underlyingToken, underlyingDecimals, 'decimals');

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

    const totalSuppliers = await countSuppliers(subgraphClient, market.address);
    const totalBorrowers = await countBorrower(subgraphClient, market.address);
    assertEqual(market, totalSuppliers, 'supplierCount');
    assertEqual(market, totalBorrowers, 'borrowerCount');

    // Check total market supply
    try {
      assert.equal(
        totalSupply.toString(),
        market.totalSupplyVTokenMantissa,
        `
      incorrect total supply market ${market.symbol} ${
        market.address
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
      market.address
    } contract ${totalBorrows.toString()} subgraph ${market.totalBorrowsMantissa.toString()}`,
      );
      console.log(`correct borrow for ${market.symbol}`);
    } catch (e) {
      console.log(e.message);
    }
  }
};

export default checkMarkets;
