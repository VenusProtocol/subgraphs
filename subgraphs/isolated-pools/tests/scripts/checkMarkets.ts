import { providers } from '@0xsequence/multicall';
import { abi as ComptrollerAbi } from '@venusprotocol/isolated-pools/artifacts/contracts/Comptroller.sol/Comptroller.json';
import { abi as VBep20Abi } from '@venusprotocol/isolated-pools/artifacts/contracts/VToken.sol/VToken.json';
import { abi as ResilientOracleAbi } from '@venusprotocol/oracle/artifacts/contracts/ResilientOracle.sol/ResilientOracle.json';
import { abi as Bep20Abi } from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/BEP20Interface.sol/BEP20Interface.json';
import assert from 'assert';
import { BigNumber, ethers } from 'ethers';
import { assertEqual } from '@venusprotocol/subgraph-utils';

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
  while (page >= 0) {
    const { marketPositions } = await subgraphClient.getMarketPositionsWithSupplyByMarketId(
      marketAddress,
      page,
    );
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
  while (page >= 0) {
    const { marketPositions } = await subgraphClient.getMarketPositionsWithBorrowByMarketId(
      marketAddress,
      page,
    );

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
    const vTokenContract = new ethers.Contract(market.id, VBep20Abi, provider);
    const underlyingAddress = await vTokenContract.underlying();
    const poolAddress = await vTokenContract.comptroller();
    const comptrollerContract = new ethers.Contract(poolAddress, ComptrollerAbi, provider);
    const priceOracleAddress = await comptrollerContract.oracle();
    const underlyingContract = new ethers.Contract(underlyingAddress, Bep20Abi, provider);
    const priceOracleContract = new ethers.Contract(
      priceOracleAddress,
      ResilientOracleAbi,
      provider,
    );
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
      underlyingName,
      underlyingSymbol,
      underlyingDecimals,
      accrualBlockNumber,
      borrowIndex,
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
      underlyingContract.name(),
      underlyingContract.symbol(),
      underlyingContract.decimals(),
      vTokenContract.accrualBlockNumber(),
      vTokenContract.borrowIndex(),
    ]);

    let underlyingPrice = BigNumber.from(0);
    try {
      underlyingPrice = await priceOracleContract.getUnderlyingPrice(market.id, {
        blockTag: +market.lastUnderlyingPriceBlockNumber,
      });
    } catch (e) {
      console.log(`failed to get price for ${market.id} ${+market.lastUnderlyingPriceBlockNumber}`);
    }
    const borrowCapMantissa = await comptrollerContract.borrowCaps(market.id);
    const supplyCapMantissa = await comptrollerContract.supplyCaps(market.id);
    const badDebtMantissa = await vTokenContract.badDebt();
    const accessControlManagerAddress = await vTokenContract.accessControlManager();

    assertEqual(market, name, 'name');
    assertEqual(market, poolAddress, 'pool', p => getAddress(p.id));

    assertEqual(market, symbol, 'symbol');
    assertEqual(market, decimals, 'vTokenDecimals');
    assertEqual(market, underlyingAddress, 'underlyingAddress', getAddress);
    assertEqual(market, underlyingName, 'underlyingName');
    assertEqual(market, underlyingSymbol, 'underlyingSymbol');
    assertEqual(market, underlyingDecimals, 'underlyingDecimals');
    assertEqual(market, marketStorage.isListed, 'isListed');
    assertEqual(market, marketStorage.collateralFactorMantissa, 'collateralFactorMantissa');
    assertEqual(market, marketStorage.liquidationThresholdMantissa, 'liquidationThresholdMantissa');
    assertEqual(market, borrowRateMantissa, 'borrowRateMantissa');
    assertEqual(market, supplyRateMantissa, 'supplyRateMantissa');

    assertEqual(market, cashMantissa, 'cashMantissa');
    assertEqual(market, exchangeRateMantissa, 'exchangeRateMantissa');
    assertEqual(market, interestRateModelAddress, 'interestRateModelAddress', getAddress);
    assertEqual(market, accrualBlockNumber, 'accrualBlockNumber');
    assertEqual(market, borrowIndex, 'borrowIndex');
    assertEqual(market, reservesMantissa, 'reservesMantissa');
    assertEqual(market, reserveFactorMantissa, 'reserveFactorMantissa');
    const bdFactor = 36 - underlyingDecimals - 2;
    const underlyingPriceInCents = underlyingPrice.div(10n ** BigInt(bdFactor));
    assertEqual(market, underlyingPriceInCents, 'lastUnderlyingPriceCents');

    assertEqual(market, borrowCapMantissa, 'borrowCapMantissa');
    assertEqual(market, supplyCapMantissa, 'supplyCapMantissa');
    assertEqual(market, badDebtMantissa, 'badDebtMantissa');

    assertEqual(market, accessControlManagerAddress, 'accessControlManagerAddress', getAddress);

    // Compare accounts
    const supplierCount = await countSuppliers(subgraphClient, market.id);
    assertEqual(market, supplierCount, 'supplierCount');
    const borrowerCount = await countBorrower(subgraphClient, market.id);
    assertEqual(market, borrowerCount, 'borrowerCount');

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

export default checkMarkets;
