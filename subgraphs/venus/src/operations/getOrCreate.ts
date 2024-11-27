import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';

import { Account, AccountVToken, Market } from '../../generated/schema';
import {
  VToken as VTokenTemplate,
  VTokenUpdatedEvents as VTokenUpdatedEventsTemplate,
} from '../../generated/templates';
import { BEP20 } from '../../generated/templates/VToken/BEP20';
import { Comptroller } from '../../generated/templates/VToken/Comptroller';
import { VToken } from '../../generated/templates/VToken/VToken';
import { zeroBigInt32 } from '../constants';
import { nativeAddress, vwbETHAddress, vTRXAddressAddress, vTUSDOldAddress } from '../constants/addresses';
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
    const comptrollerContract = Comptroller.bind(vTokenContract.comptroller());
    market = new Market(marketAddress);
    market.isListed = true;
    market.xvsBorrowStateBlock = event.block.number;
    market.xvsSupplyStateBlock = event.block.number;
    market.xvsSupplyStateIndex = BigInt.fromString('1000000000000000000000000000000000000');
    market.xvsBorrowStateIndex = BigInt.fromString('1000000000000000000000000000000000000');
    market.name = vTokenContract.name();
    market.symbol = vTokenContract.symbol();
    market.vTokenDecimals = vTokenContract.decimals();
    market.accrualBlockNumber = event.block.number;
    market.xvsSupplySpeed = zeroBigInt32;
    const supplySpeedResult = comptrollerContract.try_venusSupplySpeeds(marketAddress);
    if (!supplySpeedResult.reverted) {
      market.xvsSupplySpeed = supplySpeedResult.value;
    }
    const borrowSpeedResult = comptrollerContract.try_venusBorrowSpeeds(marketAddress);
    market.xvsBorrowSpeed = zeroBigInt32;
    if (!supplySpeedResult.reverted) {
      market.xvsBorrowSpeed = borrowSpeedResult.value;
    }

    // It is vBNB, which has a slightly different interface
    if (market.symbol == 'vBNB') {
      market.underlyingAddress = nativeAddress;
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
    market.reserveFactorMantissa = valueOrNotAvailableIntIfReverted(
      vTokenContract.try_reserveFactorMantissa(),
      'vBEP20 try_reserveFactorMantissa()',
    );
    market.lastUnderlyingPriceCents = getUnderlyingPrice(marketAddress, market.underlyingDecimals);
    market.lastUnderlyingPriceBlockNumber = event.block.number;

    market.accrualBlockNumber = vTokenContract.accrualBlockNumber();
    market.totalXvsDistributedMantissa = zeroBigInt32;
    market.collateralFactorMantissa = zeroBigInt32;
    market.supplierCount = zeroBigInt32;
    market.borrowerCount = zeroBigInt32;

    updateMarketRates(market, vTokenContract);
    updateMarketCashMantissa(market, vTokenContract);
    market.totalSupplyVTokenMantissa = zeroBigInt32;
    market.borrowIndex = valueOrNotAvailableIntIfReverted(
      vTokenContract.try_borrowIndex(),
      'vBEP20 try_borrowIndex()',
    );
    market.totalBorrowsMantissa = zeroBigInt32;
    market.reservesMantissa = zeroBigInt32;

    if (marketAddress.equals(vwbETHAddress)) {
      market.underlyingAddress = Address.fromHexString(
        '0x9c37E59Ba22c4320547F00D4f1857AF1abd1Dd6f',
      );
    }

    if (marketAddress.equals(vTRXAddressAddress)) {
      market.symbol = 'vTRXOLD';
      market.name = 'Venus TRXOLD';
    }

    if (marketAddress.equals(vTUSDOldAddress)) {
      market.symbol = 'vTUSDOLD';
      market.name = 'Venus TUSDOLD';
    }

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
  accountId: Address,
  marketId: Address,
): GetOrCreateAccountVTokenReturn {
  const accountVTokenId = getAccountVTokenId(accountId, marketId);
  let accountVToken = AccountVToken.load(accountVTokenId);
  let created = false;
  if (!accountVToken) {
    created = true;
    accountVToken = new AccountVToken(accountVTokenId);
    accountVToken.market = marketId;

    getOrCreateAccount(accountId);
    accountVToken.account = accountId;

    const vTokenContract = VToken.bind(marketId);
    accountVToken.vTokenBalanceMantissa = zeroBigInt32;

    accountVToken.totalUnderlyingRedeemedMantissa = zeroBigInt32;
    accountVToken.totalUnderlyingRepaidMantissa = zeroBigInt32;
    accountVToken.storedBorrowBalanceMantissa = zeroBigInt32;
    accountVToken.accrualBlockNumber = zeroBigInt32;
    accountVToken.borrowIndex = valueOrNotAvailableIntIfReverted(
      vTokenContract.try_borrowIndex(),
      'vBEP20 try_borrowIndex()',
    );
    accountVToken.enteredMarket = false;
    accountVToken.save();
  }
  return { entity: accountVToken, created };
}
