/* eslint-disable prefer-const */
// to satisfy AS compiler
// For each division by 10, add one to exponent to truncate one significant figure
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';

import { Comptroller, Market } from '../../generated/schema';
import { BEP20 } from '../../generated/templates/VToken/BEP20';
import { PriceOracle2 } from '../../generated/templates/VToken/PriceOracle2';
import { VToken } from '../../generated/templates/VToken/VToken';
import {
  exponentToBigDecimal,
  mantissaFactor,
  mantissaFactorBD,
  vTokenDecimalsBD,
  zeroBD,
} from './helpers';

let vUSDCAddress = '0xeca88125a5adbe82614ffc12d0db554e2e2867c8';
let vBNBAddress = '0xa07c5b74c9b40447a954e1466938b865b6bbea36';

// Used for all vBEP20 contracts
const getTokenPrice = (
  blockNumber: i32,
  eventAddress: Address,
  underlyingAddress: Address,
  underlyingDecimals: i32,
): BigDecimal => {
  let comptroller = Comptroller.load('1');
  if (!comptroller) {
    comptroller = new Comptroller('1');
  }
  if (!comptroller.priceOracle) {
    // log.debug('[getTokenPrice] empty price oracle: {}', ['0']);
    return BigDecimal.zero();
  }
  let oracleAddress = Address.fromBytes(comptroller.priceOracle);
  let underlyingPrice: BigDecimal;

  /* PriceOracle2 is used from starting of Comptroller.
   * This must use the vToken address.
   *
   * Note this returns the value without factoring in token decimals and wei, so we must divide
   * the number by (bnbDecimals - tokenDecimals) and again by the mantissa.
   */
  let mantissaDecimalFactor = 18 - underlyingDecimals + 18;
  let bdFactor = exponentToBigDecimal(mantissaDecimalFactor);
  let oracle2 = PriceOracle2.bind(oracleAddress);
  const oracleUnderlyingPrice = oracle2.getUnderlyingPrice(eventAddress).toBigDecimal();
  if (oracleUnderlyingPrice.equals(BigDecimal.zero())) {
    return oracleUnderlyingPrice;
  }
  underlyingPrice = oracleUnderlyingPrice.div(bdFactor);

  return underlyingPrice;
};

export const createMarket = (marketAddress: string): Market => {
  let market: Market;
  let contract = VToken.bind(Address.fromString(marketAddress));

  log.debug('[createMarket] market address: {}', [marketAddress]);

  // It is vBNB, which has a slightly different interface
  if (marketAddress == vBNBAddress) {
    market = new Market(marketAddress);
    market.underlyingAddress = Address.fromString('0x0000000000000000000000000000000000000000');
    market.underlyingDecimals = 18;
    market.underlyingPrice = BigDecimal.fromString('1');
    market.underlyingName = 'Binance Coin';
    market.underlyingSymbol = 'BNB';
    market.underlyingPriceUSD = zeroBD;
    // It is all other VBEP20 contracts
  } else {
    market = new Market(marketAddress);
    market.underlyingAddress = contract.underlying();
    log.debug('[createMarket] market underlying address: {}', [
      market.underlyingAddress.toHexString(),
    ]);
    let underlyingContract = BEP20.bind(Address.fromBytes(market.underlyingAddress));
    market.underlyingDecimals = underlyingContract.decimals();
    market.underlyingName = underlyingContract.name();
    market.underlyingSymbol = underlyingContract.symbol();
    market.underlyingPriceUSD = zeroBD;
    market.underlyingPrice = zeroBD;
    if (marketAddress == vUSDCAddress) {
      market.underlyingPriceUSD = BigDecimal.fromString('1');
    }
  }

  let interestRateModelAddress = contract.try_interestRateModel();
  let reserveFactor = contract.try_reserveFactorMantissa();

  market.borrowRate = zeroBD;
  market.cash = zeroBD;
  market.collateralFactor = zeroBD;
  market.exchangeRate = zeroBD;
  market.interestRateModelAddress = interestRateModelAddress.reverted
    ? Address.fromString('0x0000000000000000000000000000000000000000')
    : interestRateModelAddress.value;
  market.name = contract.name();
  market.reserves = zeroBD;
  market.supplyRate = zeroBD;
  market.symbol = contract.symbol();
  market.totalBorrows = zeroBD;
  market.totalSupply = zeroBD;

  market.accrualBlockNumber = 0;
  market.blockTimestamp = 0;
  market.borrowIndex = zeroBD;
  market.reserveFactor = reserveFactor.reverted ? BigInt.fromI32(0) : reserveFactor.value;

  return market;
};

const getBNBinUSD = (): BigDecimal => {
  let comptroller = Comptroller.load('1');
  if (!comptroller) {
    comptroller = new Comptroller('1');
  }
  // log.debug('[getBNBinUSD] price oracle: {}', [comptroller.priceOracle.toHexString()]);
  let oracleAddress = Address.fromBytes(comptroller.priceOracle);
  let oracle = PriceOracle2.bind(oracleAddress);
  let bnbPriceInUSD = oracle
    .getUnderlyingPrice(Address.fromString(vBNBAddress))
    .toBigDecimal()
    .div(mantissaFactorBD);
  return bnbPriceInUSD;
};

export const updateMarket = (
  marketAddress: Address,
  blockNumber: i32,
  blockTimestamp: i32,
): Market => {
  let marketID = marketAddress.toHexString();
  let market = Market.load(marketID);
  if (market == null) {
    log.debug('[updateMarket] market null: {}, creating...', [marketAddress.toHexString()]);
    market = createMarket(marketID);
  }

  // Only updateMarket if it has not been updated this block
  if (market.accrualBlockNumber != blockNumber) {
    let contractAddress = Address.fromString(market.id);
    let contract = VToken.bind(contractAddress);

    let bnbPriceInUSD = getBNBinUSD();

    // if vBNB, we only update USD price
    if (market.id == vBNBAddress) {
      market.underlyingPriceUSD = bnbPriceInUSD.truncate(market.underlyingDecimals);
    } else {
      let tokenPriceUSD = getTokenPrice(
        blockNumber,
        contractAddress,
        Address.fromBytes(market.underlyingAddress),
        market.underlyingDecimals,
      );
      if (bnbPriceInUSD.equals(BigDecimal.zero()) || tokenPriceUSD.equals(BigDecimal.zero())) {
        market.underlyingPrice = BigDecimal.zero();
      } else {
        market.underlyingPrice = tokenPriceUSD
          .div(bnbPriceInUSD)
          .truncate(market.underlyingDecimals);
      }
      // if USDC, we only update BNB price
      if (market.id != vUSDCAddress) {
        market.underlyingPriceUSD = tokenPriceUSD.truncate(market.underlyingDecimals);
      }
    }

    market.accrualBlockNumber = contract.accrualBlockNumber().toI32();
    market.blockTimestamp = blockTimestamp;
    market.totalSupply = contract.totalSupply().toBigDecimal().div(vTokenDecimalsBD);

    /* Exchange rate explanation
       In Practice
        - If you call the vDAI contract on bscscan it comes back (2.0 * 10^26)
        - If you call the vUSDC contract on bscscan it comes back (2.0 * 10^14)
        - The real value is ~0.02. So vDAI is off by 10^28, and vUSDC 10^16
       How to calculate for tokens with different decimals
        - Must div by tokenDecimals, 10^market.underlyingDecimals
        - Must multiply by vtokenDecimals, 10^8
        - Must div by mantissa, 10^18
     */
    let exchangeRateStored = contract.try_exchangeRateStored();
    if (exchangeRateStored.reverted) {
      log.error('***CALL FAILED*** : vBEP20 supplyRatePerBlock() reverted', []);
      market.exchangeRate = zeroBD;
    } else {
      market.exchangeRate = exchangeRateStored.value
        .toBigDecimal()
        .div(exponentToBigDecimal(market.underlyingDecimals))
        .times(vTokenDecimalsBD)
        .div(mantissaFactorBD)
        .truncate(mantissaFactor);
    }
    market.borrowIndex = contract
      .borrowIndex()
      .toBigDecimal()
      .div(mantissaFactorBD)
      .truncate(mantissaFactor);

    market.reserves = contract
      .totalReserves()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .truncate(market.underlyingDecimals);
    market.totalBorrows = contract
      .totalBorrows()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .truncate(market.underlyingDecimals);
    market.cash = contract
      .getCash()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .truncate(market.underlyingDecimals);

    // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Venus Solidity
    let borrowRatePerBlock = contract.try_borrowRatePerBlock();
    if (borrowRatePerBlock.reverted) {
      log.error('***CALL FAILED*** : vBEP20 supplyRatePerBlock() reverted', []);
      market.exchangeRate = zeroBD;
    } else {
      market.borrowRate = borrowRatePerBlock.value
        .toBigDecimal()
        .div(mantissaFactorBD)
        .truncate(mantissaFactor);
    }

    // This fails on only the first call to cZRX. It is unclear why, but otherwise it works.
    // So we handle it like this.
    let supplyRatePerBlock = contract.try_supplyRatePerBlock();
    if (supplyRatePerBlock.reverted) {
      log.info('***CALL FAILED*** : vBEP20 supplyRatePerBlock() reverted', []);
      market.supplyRate = zeroBD;
    } else {
      market.supplyRate = supplyRatePerBlock.value
        .toBigDecimal()
        .div(mantissaFactorBD)
        .truncate(mantissaFactor);
    }
    market.save();
  }
  return market as Market;
};
