import { Address, BigInt } from '@graphprotocol/graph-ts';

import { PoolRegistered } from '../../generated/PoolRegistry/PoolRegistry';
import { Account, Market, Pool } from '../../generated/schema';
import { BEP20 as BEP20Contract } from '../../generated/templates/CToken/BEP20';
import { CToken as CTokenContract } from '../../generated/templates/CToken/CToken';
import { zeroBigDecimal } from '../constants';
import {
  getInterestRateModelAddress,
  getReserveFactorMantissa,
  getUnderlyingAddress,
} from '../utilities';

export function createPool(event: PoolRegistered): Pool {
  const pool = new Pool(event.params.pool.comptroller.toHexString());
  // Fill in pool from pool lens
  pool.name = '';
  pool.creator = event.address;
  pool.blockPosted = event.block.number;
  pool.timestampPosted = event.block.timestamp;
  pool.riskRating = '';
  pool.category = '';
  pool.logoURL = '';
  pool.description = '';
  pool.priceOracle = Address.fromString('0x0000000000000000000000000000000000000000');
  pool.pauseGuardian = Address.fromString('0x0000000000000000000000000000000000000000');
  pool.closeFactor = new BigInt(0);
  pool.liquidationIncentive = new BigInt(0);
  pool.maxAssets = new BigInt(0);
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
