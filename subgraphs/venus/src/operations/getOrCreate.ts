import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts';

import { Comptroller as ComptrollerContract } from '../../generated/Comptroller/Comptroller';
import { Account, AccountVToken, Comptroller, Market } from '../../generated/schema';
import { AccountVTokenTransaction } from '../../generated/schema';
import {
  VToken as VTokenTemplate,
  VTokenUpdatedEvents as VTokenUpdatedEventsTemplate,
} from '../../generated/templates';
import { BEP20 } from '../../generated/templates/VToken/BEP20';
import { VToken } from '../../generated/templates/VToken/VToken';
import { zeroBigInt32 } from '../constants';
import { comptrollerAddress, nullAddress } from '../constants/addresses';
import { getUnderlyingPrice } from '../utilities/getUnderlyingPrice';
import { getAccountVTokenId, getAccountVTokenTransactionId } from '../utilities/ids';

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

export function getOrCreateMarket(marketId: string): Market {
  let market = Market.load(marketId);
  if (!market) {
    log.debug('[createMarket] market address: {}', [marketId]);

    const marketAddress = Address.fromString(marketId);
    const vTokenContract = VToken.bind(marketAddress);
    const vTokenSymbol = vTokenContract.symbol();

    market = new Market(marketId);
    // It is vBNB, which has a slightly different interface
    if (vTokenSymbol == 'vBNB') {
      market.underlyingAddress = nullAddress;
      market.underlyingDecimals = 18;
      market.underlyingName = 'BNB';
      market.underlyingSymbol = 'BNB';
      market.underlyingPriceCents = zeroBigInt32;
      // It is all other VBEP20 contracts
    } else {
      market.underlyingAddress = vTokenContract.underlying();
      log.debug('[createMarket] market underlying address: {}', [
        market.underlyingAddress.toHexString(),
      ]);
      const underlyingContract = BEP20.bind(Address.fromBytes(market.underlyingAddress));
      market.underlyingDecimals = underlyingContract.decimals();
      market.underlyingName = underlyingContract.name();
      market.underlyingSymbol = underlyingContract.symbol();

      const underlyingPriceCents = getUnderlyingPrice(market.id, market.underlyingDecimals);
      market.underlyingPriceCents = underlyingPriceCents;
    }

    market.vTokenDecimals = vTokenContract.decimals();

    const interestRateModelAddress = vTokenContract.try_interestRateModel();
    const reserveFactor = vTokenContract.try_reserveFactorMantissa();

    market.borrowRateMantissa = zeroBigInt32;
    market.cashMantissa = zeroBigInt32;
    market.collateralFactorMantissa = zeroBigInt32;
    market.exchangeRateMantissa = zeroBigInt32;
    market.interestRateModelAddress = interestRateModelAddress.reverted
      ? nullAddress
      : interestRateModelAddress.value;
    market.name = vTokenContract.name();
    market.reservesMantissa = zeroBigInt32;
    market.supplyRateMantissa = zeroBigInt32;
    market.symbol = vTokenContract.symbol();
    market.totalBorrowsMantissa = zeroBigInt32;
    market.totalSupplyMantissa = zeroBigInt32;

    market.accrualBlockNumber = 0;
    market.blockTimestamp = 0;
    market.borrowIndexMantissa = zeroBigInt32;
    market.reserveFactor = reserveFactor.reverted ? zeroBigInt32 : reserveFactor.value;
    market.totalXvsDistributedMantissa = zeroBigInt32;

    market.supplierCount = zeroBigInt32;
    market.borrowerCount = zeroBigInt32;
    market.borrowerCountAdjusted = zeroBigInt32;
    market.save();

    // Dynamically index all new listed tokens
    VTokenTemplate.create(marketAddress);
    VTokenUpdatedEventsTemplate.create(marketAddress);
  }
  return market;
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

export function getOrCreateAccountVToken(marketId: string, accountId: string): AccountVToken {
  const accountVTokenId = getAccountVTokenId(
    Address.fromString(marketId),
    Address.fromString(accountId),
  );
  let accountVToken = AccountVToken.load(accountVTokenId);
  if (!accountVToken) {
    const market = getOrCreateMarket(marketId);
    const symbol = market.symbol;

    accountVToken = new AccountVToken(accountVTokenId);
    accountVToken.symbol = symbol;
    accountVToken.market = marketId;
    accountVToken.account = accountId;
    accountVToken.accrualBlockNumber = BigInt.fromI32(0);
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

export function getOrCreateAccountVTokenTransaction(
  marketId: string,
  accountId: string,
  event: ethereum.Event,
): AccountVTokenTransaction {
  const accountVTokenId = getAccountVTokenId(
    Address.fromString(marketId),
    Address.fromString(accountId),
  );
  const id = getAccountVTokenTransactionId(
    accountVTokenId,
    event.transaction.hash,
    event.transaction.index,
  );

  let transaction = AccountVTokenTransaction.load(id);
  if (transaction == null) {
    transaction = new AccountVTokenTransaction(id);
    transaction.account = accountId;
    transaction.tx_hash = event.transaction.hash; // eslint-disable-line @typescript-eslint/naming-convention
    transaction.logIndex = event.transaction.index;
    transaction.timestamp = event.block.timestamp;
    transaction.block = event.block.number;
    transaction.save();
  }
  return transaction;
}
