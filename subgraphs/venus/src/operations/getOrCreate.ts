import { Address, ethereum } from '@graphprotocol/graph-ts';

import { Comptroller as ComptrollerContract } from '../../generated/Comptroller/Comptroller';
import { Account, AccountVToken, Comptroller } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { zeroBigInt32 } from '../constants';
import { comptrollerAddress } from '../constants/addresses';
import { getAccountVTokenId } from '../utilities/ids';

export function getOrCreateComptroller(): Comptroller {
  let comptroller = Comptroller.load(comptrollerAddress.toHexString());
  if (!comptroller) {
    comptroller = new Comptroller(comptrollerAddress.toHexString());
    const comptrollerContract = ComptrollerContract.bind(comptrollerAddress);
    comptroller.priceOracle = comptrollerContract.oracle();
    comptroller.closeFactor = comptrollerContract.closeFactorMantissa();
    comptroller.liquidationIncentive = comptrollerContract.liquidationIncentiveMantissa();
    comptroller.maxAssets = comptrollerContract.maxAssets();
    comptroller.save();
  }
  return comptroller;
}

export function getOrCreateAccount(accountId: string): Account {
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.countLiquidated = 0;
    account.countLiquidator = 0;
    account.hasBorrowed = false;
    account.save();
  }
  return account;
}

export function getOrCreateAccountVToken(
  marketId: string,
  marketSymbol: string,
  accountId: string,
  event: ethereum.Event,
): AccountVToken {
  const accountVTokenId = getAccountVTokenId(
    Address.fromString(marketId),
    Address.fromString(accountId),
  );
  let accountVToken = AccountVToken.load(accountVTokenId);
  if (!accountVToken) {
    accountVToken = new AccountVToken(accountVTokenId);
    accountVToken.market = marketId;
    accountVToken.symbol = marketSymbol;
    accountVToken.account = accountId;
    accountVToken.accrualBlockNumber = event.block.number;
    // we need to set an initial real onchain value to this otherwise it will never be accurate
    const vTokenContract = VToken.bind(Address.fromString(marketId));
    accountVToken.vTokenBalanceMantissa = vTokenContract.balanceOf(Address.fromString(accountId));

    accountVToken.totalUnderlyingSuppliedMantissa = zeroBigInt32;
    accountVToken.totalUnderlyingRedeemedMantissa = zeroBigInt32;
    accountVToken.accountBorrowIndexMantissa = zeroBigInt32;
    accountVToken.totalUnderlyingBorrowedMantissa = zeroBigInt32;
    accountVToken.totalUnderlyingRepaidMantissa = zeroBigInt32;
    accountVToken.storedBorrowBalanceMantissa = zeroBigInt32;
    accountVToken.enteredMarket = false;
    accountVToken.save();
  }
  return accountVToken;
}
