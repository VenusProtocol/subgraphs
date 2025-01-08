import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';

import { Account, MarketPosition, Market, Token } from '../../generated/schema';
import {
  VToken as VTokenTemplate,
  VTokenUpdatedEvents as VTokenUpdatedEventsTemplate,
} from '../../generated/templates';
import { BEP20 } from '../../generated/templates/VToken/BEP20';
import { Comptroller } from '../../generated/templates/VToken/Comptroller';
import { VToken } from '../../generated/templates/VToken/VToken';
import { zeroBigInt32 } from '../constants';
import {
  nativeAddress,
  wbETHAddress,
  vTRXAddressAddress,
  vTUSDOldAddress,
} from '../constants/addresses';
import {
  getUnderlyingPrice,
  valueOrNotAvailableAddressIfReverted,
  valueOrNotAvailableIntIfReverted,
} from '../utilities';
import { getMarketPositionId, getTokenId } from '../utilities/ids';
import { getMarket } from './get';
import { updateMarketCashMantissa } from './updateMarketCashMantissa';
import { updateMarketRates } from './updateMarketRates';

export function getOrCreateMarket(marketAddress: Address, event: ethereum.Event): Market {
  let market = getMarket(marketAddress);
  if (!market) {
    const vTokenContract = VToken.bind(marketAddress);
    const comptrollerContract = Comptroller.bind(vTokenContract.comptroller());
    market = new Market(marketAddress);
    market.address = marketAddress;
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
      const tokenEntity = new Token(getTokenId(nativeAddress));
      tokenEntity.address = nativeAddress;
      tokenEntity.name = 'BNB';
      tokenEntity.symbol = 'BNB';
      tokenEntity.decimals = 18;
      tokenEntity.save();
      market.underlyingToken = tokenEntity.id;
    } else {
      market.underlyingToken = getOrCreateToken(vTokenContract.underlying()).id;
    }

    market.interestRateModelAddress = valueOrNotAvailableAddressIfReverted(
      vTokenContract.try_interestRateModel(),
      'vBEP20 try_interestRateModel()',
    );
    market.reserveFactorMantissa = valueOrNotAvailableIntIfReverted(
      vTokenContract.try_reserveFactorMantissa(),
      'vBEP20 try_reserveFactorMantissa()',
    );
    const underlyingToken = getOrCreateToken(Address.fromBytes(market.underlyingToken));
    market.lastUnderlyingPriceCents = getUnderlyingPrice(marketAddress, underlyingToken.decimals);
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
    account.address = accountId;
    account.countLiquidated = 0;
    account.countLiquidator = 0;
    account.hasBorrowed = false;
    account.save();
  }
  return account;
}

export class GetOrCreateMarketPositionReturn {
  entity: MarketPosition;
  created: boolean;
}

export function getOrCreateMarketPosition(
  accountId: Address,
  marketId: Address,
): GetOrCreateMarketPositionReturn {
  const marketPositionId = getMarketPositionId(accountId, marketId);
  let marketPosition = MarketPosition.load(marketPositionId);
  let created = false;
  if (!marketPosition) {
    created = true;
    marketPosition = new MarketPosition(marketPositionId);
    marketPosition.market = marketId;

    getOrCreateAccount(accountId);
    marketPosition.account = accountId;

    const vTokenContract = VToken.bind(marketId);
    marketPosition.vTokenBalanceMantissa = zeroBigInt32;

    marketPosition.totalUnderlyingRedeemedMantissa = zeroBigInt32;
    marketPosition.totalUnderlyingRepaidMantissa = zeroBigInt32;
    marketPosition.storedBorrowBalanceMantissa = zeroBigInt32;
    marketPosition.accrualBlockNumber = zeroBigInt32;
    marketPosition.borrowIndex = valueOrNotAvailableIntIfReverted(
      vTokenContract.try_borrowIndex(),
      'vBEP20 try_borrowIndex()',
    );
    marketPosition.enteredMarket = false;
    marketPosition.save();
  }
  return { entity: marketPosition, created };
}

function getOrCreateWrappedEthToken(): Token {
  const underlyingTokenAddress = Address.fromBytes(
    Bytes.fromHexString('0x9c37E59Ba22c4320547F00D4f1857AF1abd1Dd6f'),
  );
  const tokenEntity = new Token(getTokenId(underlyingTokenAddress));
  tokenEntity.address = underlyingTokenAddress;
  tokenEntity.name = 'Wrapped Binance Beacon ETH';
  tokenEntity.symbol = 'wBETH';
  tokenEntity.decimals = 18;
  tokenEntity.save();
  return tokenEntity;
}

/**
 * Creates and Token object with symbol and address
 *
 * @param asset Address of the token
 * @returns Token
 */
export function getOrCreateToken(asset: Address): Token {
  let tokenEntity = Token.load(getTokenId(asset));

  if (!tokenEntity) {
    if (asset.equals(wbETHAddress)) {
      return getOrCreateWrappedEthToken();
    } else {
      const erc20 = BEP20.bind(asset);
      tokenEntity = new Token(getTokenId(asset));
      tokenEntity.address = asset;
      tokenEntity.name = erc20.name();
      tokenEntity.symbol = erc20.symbol();
      tokenEntity.decimals = erc20.decimals();
      tokenEntity.save();
    }
  }
  return tokenEntity;
}
