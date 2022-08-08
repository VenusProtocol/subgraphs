import { Address } from '@graphprotocol/graph-ts';

import { Account, Market, Pool } from '../../generated/schema';
import { BEP20 as BEP20Contract } from '../../generated/templates/CToken/BEP20';
import { CToken as CTokenContract } from '../../generated/templates/CToken/CToken';
import { zeroBigDecimal } from '../constants';
import {
  getInterestRateModelAddress,
  getReserveFactorMantissa,
  getUnderlyingAddress,
} from '../utilities';

export function createPool(poolAddress: Address): Pool {
  const pool = new Pool(poolAddress.toHexString());
  // Fill in pool from pool lens
  pool.save();
  return pool;
}

export function createAccount(accountAddress: Address): Account {
  const account = new Account(accountAddress.toHexString());
  account.tokens = [];
  account.countLiquidated = 0;
  account.countLiquidator = 0;
  account.hasBorrowed = false;
  account.save();
  return account;
}

export function createMarket(cTokenAddress: Address): Market {
  const cTokenContract = CTokenContract.bind(cTokenAddress);
  const underlyingAddress = getUnderlyingAddress(cTokenContract);
  const underlyingContract = BEP20Contract.bind(Address.fromBytes(underlyingAddress));

  const market = new Market(cTokenAddress.toHexString());
  market.pool = cTokenContract.comptroller();
  market.name = cTokenContract.name();
  market.interestRateModelAddress = getInterestRateModelAddress(cTokenContract);
  market.symbol = cTokenContract.symbol();
  market.underlyingAddress = underlyingAddress;
  market.underlyingName = underlyingContract.name();
  market.underlyingSymbol = underlyingContract.symbol();
  market.underlyingPriceUSD = zeroBigDecimal;
  market.underlyingDecimals = underlyingContract.decimals();

  market.borrowRate = zeroBigDecimal;
  market.cash = zeroBigDecimal;
  market.collateralFactor = zeroBigDecimal;
  market.exchangeRate = zeroBigDecimal;
  market.reserves = zeroBigDecimal;
  market.supplyRate = zeroBigDecimal;
  market.totalBorrows = zeroBigDecimal;
  market.totalSupply = zeroBigDecimal;
  market.underlyingPrice = zeroBigDecimal;
  market.accrualBlockNumber = 0;
  market.blockTimestamp = 0;
  market.borrowIndex = zeroBigDecimal;
  market.reserveFactor = getReserveFactorMantissa(cTokenContract);
  market.save();
  return market;
}
