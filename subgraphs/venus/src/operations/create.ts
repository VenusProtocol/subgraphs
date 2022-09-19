import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';

import { Account, AccountVToken, Market } from '../../generated/schema';
import { BEP20 } from '../../generated/templates/VToken/BEP20';
import { VToken } from '../../generated/templates/VToken/VToken';
import { vBNBAddress, vUSDCAddress } from '../constants/addresses';
import { zeroBD } from '../utilities/exponentToBigDecimal';

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

  vTokenStats.totalUnderlyingSupplied = zeroBD;
  vTokenStats.totalUnderlyingRedeemed = zeroBD;
  vTokenStats.accountBorrowIndex = zeroBD;
  vTokenStats.totalUnderlyingBorrowed = zeroBD;
  vTokenStats.totalUnderlyingRepaid = zeroBD;
  vTokenStats.storedBorrowBalance = zeroBD;
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
    const underlyingContract = BEP20.bind(Address.fromBytes(market.underlyingAddress));
    market.underlyingDecimals = underlyingContract.decimals();
    market.underlyingName = underlyingContract.name();
    market.underlyingSymbol = underlyingContract.symbol();

    market.underlyingPriceUSD = zeroBD; // fix
    market.underlyingPrice = zeroBD; // fix
    if (marketAddress == vUSDCAddress) {
      market.underlyingPriceUSD = BigDecimal.fromString('1');
    }
  }

  const interestRateModelAddress = contract.try_interestRateModel();
  const reserveFactor = contract.try_reserveFactorMantissa();

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
