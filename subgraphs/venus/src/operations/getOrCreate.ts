import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';

import { Account, AccountVToken, Market } from '../../generated/schema';
import {
  VToken as VTokenTemplate,
  VTokenUpdatedEvents as VTokenUpdatedEventsTemplate,
} from '../../generated/templates';
import { BEP20 } from '../../generated/templates/VToken/BEP20';
import { VToken } from '../../generated/templates/VToken/VToken';
import { zeroBigInt32 } from '../constants';
import { nullAddress } from '../constants/addresses';
import {
  getUnderlyingPrice,
  valueOrNotAvailableAddressIfReverted,
  valueOrNotAvailableIntIfReverted,
} from '../utilities';
import { getAccountVTokenId } from '../utilities/ids';
import { getMarket } from './get';
import { updateMarketCashMantissa } from './updateMarketCashMantissa';
import { updateMarketRates } from './updateMarketRates';

export function getOrCreateMarket(marketAddress: Address, event: ethereum.Event): Market {
  let market = getMarket(marketAddress);
  if (!market) {
    const vTokenContract = VToken.bind(marketAddress);
    market = new Market(marketAddress);
    market.isListed = true;
    market.xvsBorrowStateBlock = event.block.number;
    market.xvsSupplyStateBlock = event.block.number;
    market.xvsSupplyStateIndex = BigInt.fromString('1000000000000000000000000000000000000');
    market.xvsBorrowStateIndex = BigInt.fromString('1000000000000000000000000000000000000');
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
    market.lastUnderlyingPriceCents =
      market.symbol == 'vBNB'
        ? zeroBigInt32
        : getUnderlyingPrice(marketAddress, market.underlyingDecimals);
    market.lastUnderlyingPriceBlockNumber = event.block.number;

    market.accrualBlockNumber = vTokenContract.accrualBlockNumber().toI32();
    market.totalXvsDistributedMantissa = zeroBigInt32;
    market.collateralFactorMantissa = zeroBigInt32;
    market.supplierCount = zeroBigInt32;
    market.borrowerCount = zeroBigInt32;
    market.borrowerCountAdjusted = zeroBigInt32;

    updateMarketRates(market, vTokenContract);
    updateMarketCashMantissa(market, vTokenContract);
    market.totalSupplyVTokenMantissa = vTokenContract.totalSupply();
    market.borrowIndex = vTokenContract.borrowIndex();
    market.totalBorrowsMantissa = vTokenContract.totalBorrows();
    market.reservesMantissa = vTokenContract.totalReserves();

    // Dynamically index all new listed tokens
    VTokenTemplate.create(marketAddress);
    VTokenUpdatedEventsTemplate.create(marketAddress);

    market.save();
  }

  return market;
}

export function getOrCreateAccount(accountId: Bytes): Account {
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

export class GetOrCreateAccountVTokenReturn {
  entity: AccountVToken;
  created: boolean;
}

export function getOrCreateAccountVToken(
  marketId: Address,
  accountId: Address,
): GetOrCreateAccountVTokenReturn {
  const accountVTokenId = getAccountVTokenId(marketId, accountId);
  let accountVToken = AccountVToken.load(accountVTokenId);
  let created = false;
  if (!accountVToken) {
    created = true;
    accountVToken = new AccountVToken(accountVTokenId);
    accountVToken.market = marketId;
    accountVToken.account = accountId;
    // we need to set an initial real onchain value to this otherwise it will never be accurate
    const vTokenContract = VToken.bind(marketId);
    accountVToken.vTokenBalanceMantissa = vTokenContract.balanceOf(accountId);

    accountVToken.totalUnderlyingRedeemedMantissa = zeroBigInt32;
    accountVToken.totalUnderlyingRepaidMantissa = zeroBigInt32;
    accountVToken.storedBorrowBalanceMantissa = zeroBigInt32;
    accountVToken.borrowIndex = vTokenContract.borrowIndex();
    accountVToken.enteredMarket = false;
    accountVToken.save();
  }
  return { entity: accountVToken, created };
}
