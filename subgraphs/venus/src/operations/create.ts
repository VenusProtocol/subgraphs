import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';

import { Account, AccountVToken, Market } from '../../generated/schema';
import { BEP20 } from '../../generated/templates/VToken/BEP20';
import { VToken } from '../../generated/templates/VToken/VToken';
import { zeroBigInt32, zeroBigDecimal } from '../constants';
import { nullAddress, vBnbAddress } from '../constants/addresses';
import { getUnderlyingPrice } from '../utilities/getUnderlyingPrice';

export const createAccountVToken = (
  vTokenStatsID: string,
  symbol: string,
  account: string,
  marketID: string,
): AccountVToken => {
  const vTokenStats = new AccountVToken(vTokenStatsID);
  vTokenStats.symbol = symbol;
  vTokenStats.market = marketID;
  vTokenStats.account = account;
  vTokenStats.accrualBlockNumber = BigInt.fromI32(0);
  // we need to set an initial real onchain value to this otherwise it will never
  // be accurate
  const vTokenContract = BEP20.bind(Address.fromString(marketID));
  vTokenStats.vTokenBalance = new BigDecimal(vTokenContract.balanceOf(Address.fromString(account)));
  // log.debug('[createAccountVToken] vTokenBalance: {}, account: {}, vToken: {}', [vTokenStats.vTokenBalance.toString(), account, marketID]);

  vTokenStats.totalUnderlyingSupplied = zeroBigDecimal;
  vTokenStats.totalUnderlyingRedeemed = zeroBigDecimal;
  vTokenStats.accountBorrowIndex = zeroBigDecimal;
  vTokenStats.totalUnderlyingBorrowed = zeroBigDecimal;
  vTokenStats.totalUnderlyingRepaid = zeroBigDecimal;
  vTokenStats.storedBorrowBalance = zeroBigDecimal;
  vTokenStats.enteredMarket = false;
  return vTokenStats;
};

export const createAccount = (accountID: string): Account => {
  const account = new Account(accountID);
  account.countLiquidated = 0;
  account.countLiquidator = 0;
  account.hasBorrowed = false;
  account.save();
  return account;
};

export const createMarket = (marketAddress: string): Market => {
  let market: Market;
  const contract = VToken.bind(Address.fromString(marketAddress));

  log.debug('[createMarket] market address: {}', [marketAddress]);

  // It is vBNB, which has a slightly different interface
  if (marketAddress == vBnbAddress.toHexString()) {
    market = new Market(marketAddress);
    market.underlyingAddress = nullAddress;
    market.underlyingDecimals = 18;
    market.underlyingPrice = BigDecimal.fromString('1');
    market.underlyingName = 'Binance Coin';
    market.underlyingSymbol = 'BNB';
    market.underlyingPriceUSD = zeroBigDecimal;
    // It is all other VBEP20 contracts
  } else {
    market = new Market(marketAddress);
    market.underlyingAddress = contract.underlying();
    log.debug('[createMarket] market underlying address: {}', [
      market.underlyingAddress.toHexString(),
    ]);
    const underlyingContract = BEP20.bind(Address.fromBytes(market.underlyingAddress));
    market.underlyingDecimals = underlyingContract.decimals();
    market.underlyingName = underlyingContract.name();
    market.underlyingSymbol = underlyingContract.symbol();

    const underlyingValue = getUnderlyingPrice(market.id, market.underlyingDecimals);
    market.underlyingPrice = underlyingValue.underlyingPrice;
    market.underlyingPriceUSD = underlyingValue.underlyingPriceUsd;
  }

  const interestRateModelAddress = contract.try_interestRateModel();
  const reserveFactor = contract.try_reserveFactorMantissa();

  market.borrowRate = zeroBigDecimal;
  market.cash = zeroBigDecimal;
  market.collateralFactor = zeroBigDecimal;
  market.exchangeRate = zeroBigDecimal;
  market.interestRateModelAddress = interestRateModelAddress.reverted
    ? nullAddress
    : interestRateModelAddress.value;
  market.name = contract.name();
  market.reservesWei = BigInt.fromI32(0);
  market.supplyRate = zeroBigDecimal;
  market.symbol = contract.symbol();
  market.totalBorrows = zeroBigDecimal;
  market.totalSupply = zeroBigDecimal;

  market.accrualBlockNumber = 0;
  market.blockTimestamp = 0;
  market.borrowIndex = zeroBigDecimal;
  market.reserveFactor = reserveFactor.reverted ? BigInt.fromI32(0) : reserveFactor.value;
  market.totalXvsDistributedMantissa = zeroBigInt32;

  return market;
};
