import { Address, ethereum, log } from '@graphprotocol/graph-ts';

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
import {
  getUnderlyingPrice,
  valueOrNotAvailableAddressIfReverted,
  valueOrNotAvailableIntIfReverted,
} from '../utilities';
import { getAccountVTokenId, getAccountVTokenTransactionId } from '../utilities/ids';
import { getMarket } from './get';
import { updateMarketCashMantissa } from './updateMarketCashMantissa';
import { updateMarketRates } from './updateMarketRates';
import { updateMarketTotalSupplyMantissa } from './updateMarketTotalSupplyMantissa';

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

export function getOrCreateMarket(marketAddress: Address, event: ethereum.Event): Market {
  // @todo add and use market id utility
  let market = getMarket(marketAddress);
  if (!market) {
    const vTokenContract = VToken.bind(marketAddress);
    market = new Market(marketAddress.toHexString());
    market.name = vTokenContract.name();
    market.symbol = vTokenContract.symbol();
    market.vTokenDecimals = vTokenContract.decimals();
    market.blockTimestamp = event.block.timestamp.toI32();

    // It is vBNB, which has a slightly different interface
    if (market.symbol == 'vBNB') {
      market.underlyingAddress = nullAddress;
      market.underlyingDecimals = 18;
      market.underlyingName = 'BNB';
      market.underlyingSymbol = 'BNB';
    } else {
      market.underlyingAddress = vTokenContract.underlying();
      log.debug('[createMarket] market underlying address: {}', [
        market.underlyingAddress.toHexString(),
      ]);
      const underlyingContract = BEP20.bind(Address.fromBytes(market.underlyingAddress));
      market.underlyingDecimals = underlyingContract.decimals();
      market.underlyingName = underlyingContract.name();
      market.underlyingSymbol = underlyingContract.symbol();
    }

    market.interestRateModelAddress = valueOrNotAvailableAddressIfReverted(
      vTokenContract.try_interestRateModel(),
      'vBEP20 try_interestRateModel()',
    );
    market.reserveFactor = valueOrNotAvailableIntIfReverted(
      vTokenContract.try_reserveFactorMantissa(),
      'vBEP20 try_reserveFactorMantissa()',
    );
    market.underlyingPriceCents =
      market.symbol == 'vBNB'
        ? zeroBigInt32
        : getUnderlyingPrice(market.id, market.underlyingDecimals);

    market.accrualBlockNumber = vTokenContract.accrualBlockNumber().toI32();
    market.totalXvsDistributedMantissa = zeroBigInt32;
    market.collateralFactorMantissa = zeroBigInt32;
    market.supplierCount = zeroBigInt32;
    market.borrowerCount = zeroBigInt32;
    market.borrowerCountAdjusted = zeroBigInt32;

    updateMarketRates(market, vTokenContract);
    updateMarketCashMantissa(market, vTokenContract);
    updateMarketTotalSupplyMantissa(market, vTokenContract);
    market.borrowIndexMantissa = vTokenContract.borrowIndex();
    market.totalBorrowsMantissa = vTokenContract.totalBorrows();
    market.reservesMantissa = vTokenContract.totalReserves();

    // Dynamically index all new listed tokens
    VTokenTemplate.create(marketAddress);
    VTokenUpdatedEventsTemplate.create(marketAddress);

    market.save();
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

export function getOrCreateAccountVTokenTransaction(
  accountVTokenId: string,
  event: ethereum.Event,
): AccountVTokenTransaction {
  const id = getAccountVTokenTransactionId(
    accountVTokenId,
    event.transaction.hash,
    event.transactionLogIndex,
  );
  let transaction = AccountVTokenTransaction.load(id);
  if (transaction == null) {
    transaction = new AccountVTokenTransaction(id);
    transaction.account = accountVTokenId;
    transaction.tx_hash = event.transaction.hash; // eslint-disable-line @typescript-eslint/naming-convention
    transaction.logIndex = event.transactionLogIndex;
    transaction.timestamp = event.block.timestamp;
    transaction.block = event.block.number;
    transaction.save();
  }
  return transaction;
}
