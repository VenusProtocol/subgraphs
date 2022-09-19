import { Address, BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts';

import { AccountVToken, Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { vBNBAddress, vUSDCAddress } from '../constants/addresses';
import { createMarket } from '../operations/create';
import { getBnbPriceInUsd, getTokenPrice } from '../utilities';
import {
  exponentToBigDecimal,
  mantissaFactor,
  mantissaFactorBD,
  vTokenDecimalsBD,
  zeroBD,
} from '../utilities/exponentToBigDecimal';
import { createAccountVToken } from './create';
import { getOrCreateAccountVTokenTransaction } from './getOrCreate';

export const updateCommonVTokenStats = (
  marketID: string,
  marketSymbol: string,
  accountID: string,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
): AccountVToken => {
  const vTokenStatsID = marketID.concat('-').concat(accountID);
  let vTokenStats = AccountVToken.load(vTokenStatsID);
  if (vTokenStats == null) {
    vTokenStats = createAccountVToken(vTokenStatsID, marketSymbol, accountID, marketID);
  }
  getOrCreateAccountVTokenTransaction(vTokenStatsID, txHash, timestamp, blockNumber, logIndex);
  vTokenStats.accrualBlockNumber = blockNumber;
  return vTokenStats as AccountVToken;
};

export const updateMarket = (
  marketAddress: Address,
  blockNumber: i32,
  blockTimestamp: i32,
): Market => {
  const marketID = marketAddress.toHexString();
  let market = Market.load(marketID);
  if (market == null) {
    log.debug('[updateMarket] market null: {}, creating...', [marketAddress.toHexString()]);
    market = createMarket(marketID);
  }

  // Only updateMarket if it has not been updated this block
  if (market.accrualBlockNumber != blockNumber) {
    const contractAddress = Address.fromString(market.id);
    const contract = VToken.bind(contractAddress);

    market.accrualBlockNumber = contract.accrualBlockNumber().toI32();
    market.blockTimestamp = blockTimestamp;

    const bnbPriceInUSD = getBnbPriceInUsd();

    // if vBNB, we only update USD price
    if (market.id == vBNBAddress) {
      market.underlyingPriceUSD = bnbPriceInUSD.truncate(market.underlyingDecimals);
    } else {
      const tokenPriceUSD = getTokenPrice(contractAddress, market.underlyingDecimals);
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
    const exchangeRateStored = contract.try_exchangeRateStored();
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
    const borrowRatePerBlock = contract.try_borrowRatePerBlock();
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
    const supplyRatePerBlock = contract.try_supplyRatePerBlock();
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
