import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import { Account, AccountVToken, Market, MintEvent, RedeemEvent } from '../../generated/schema';
import { BEP20 } from '../../generated/templates/VToken/BEP20';
import { VToken } from '../../generated/templates/VToken/VToken';
import { zeroBigInt32 } from '../constants';
import { nullAddress, vBnbAddress } from '../constants/addresses';
import { getUnderlyingPrice } from '../utilities/getUnderlyingPrice';
import { getTransactionId } from '../utilities/ids';

export function createAccountVToken(
  accountVTokenId: string,
  symbol: string,
  account: string,
  marketId: string,
): AccountVToken {
  const accountVToken = new AccountVToken(accountVTokenId);
  accountVToken.symbol = symbol;
  accountVToken.market = marketId;
  accountVToken.account = account;
  accountVToken.accrualBlockNumber = BigInt.fromI32(0);
  // we need to set an initial real onchain value to this otherwise it will never be accurate
  const vTokenContract = VToken.bind(Address.fromString(marketId));
  accountVToken.vTokenBalanceMantissa = vTokenContract.balanceOf(Address.fromString(account));

  accountVToken.totalUnderlyingSuppliedMantissa = zeroBigInt32;
  accountVToken.totalUnderlyingRedeemedMantissa = zeroBigInt32;
  accountVToken.accountBorrowIndexMantissa = zeroBigInt32;
  accountVToken.totalUnderlyingBorrowedMantissa = zeroBigInt32;
  accountVToken.totalUnderlyingRepaidMantissa = zeroBigInt32;
  accountVToken.storedBorrowBalanceMantissa = zeroBigInt32;
  accountVToken.enteredMarket = false;
  return accountVToken;
}

export function createAccount(accountId: string): Account {
  const account = new Account(accountId);
  account.countLiquidated = 0;
  account.countLiquidator = 0;
  account.hasBorrowed = false;
  account.save();
  return account;
}

export function createMarket(marketAddress: string): Market {
  let market: Market;
  const contract = VToken.bind(Address.fromString(marketAddress));

  log.debug('[createMarket] market address: {}', [marketAddress]);

  // It is vBNB, which has a slightly different interface
  if (marketAddress == vBnbAddress.toHexString()) {
    market = new Market(marketAddress);
    market.underlyingAddress = nullAddress;
    market.underlyingDecimals = 18;
    market.underlyingName = 'Binance Coin';
    market.underlyingSymbol = 'BNB';
    market.underlyingPriceCents = zeroBigInt32;
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

    const underlyingPriceCents = getUnderlyingPrice(market.id, market.underlyingDecimals);
    market.underlyingPriceCents = underlyingPriceCents;
  }

  market.vTokenDecimals = contract.decimals();

  const interestRateModelAddress = contract.try_interestRateModel();
  const reserveFactor = contract.try_reserveFactorMantissa();

  market.borrowRateMantissa = zeroBigInt32;
  market.cashMantissa = zeroBigInt32;
  market.collateralFactorMantissa = zeroBigInt32;
  market.exchangeRateMantissa = zeroBigInt32;
  market.interestRateModelAddress = interestRateModelAddress.reverted
    ? nullAddress
    : interestRateModelAddress.value;
  market.name = contract.name();
  market.reservesMantissa = BigInt.fromI32(0);
  market.supplyRateMantissa = zeroBigInt32;
  market.symbol = contract.symbol();
  market.totalBorrowsMantissa = zeroBigInt32;
  market.totalSupplyMantissa = zeroBigInt32;

  market.accrualBlockNumber = 0;
  market.blockTimestamp = 0;
  market.borrowIndexMantissa = zeroBigInt32;
  market.reserveFactor = reserveFactor.reverted ? BigInt.fromI32(0) : reserveFactor.value;
  market.totalXvsDistributedMantissa = zeroBigInt32;

  market.supplierCount = zeroBigInt32;
  market.borrowerCount = zeroBigInt32;
  market.borrowerCountAdjusted = zeroBigInt32;

  return market;
}

export function createMintEvent<E>(event: E): void {
  const mintId = getTransactionId(event.transaction.hash, event.transactionLogIndex);

  const mint = new MintEvent(mintId);
  mint.amountMantissa = event.params.mintTokens;
  mint.to = event.params.minter;
  mint.from = event.address;
  mint.blockNumber = event.block.number.toI32();
  mint.blockTime = event.block.timestamp.toI32();
  mint.vTokenAddress = event.address;
  mint.underlyingAmountMantissa = event.params.mintAmount;
  mint.save();
}

export function createMintBehalfEvent<E>(event: E): void {
  const mintId = getTransactionId(event.transaction.hash, event.transactionLogIndex);

  const mint = new MintEvent(mintId);
  mint.amountMantissa = event.params.mintTokens;
  mint.to = event.params.receiver;
  mint.from = event.address;
  mint.blockNumber = event.block.number.toI32();
  mint.blockTime = event.block.timestamp.toI32();
  mint.vTokenAddress = event.address;
  mint.underlyingAmountMantissa = event.params.mintAmount;
  mint.save();
}

export function createRedeemEvent<E>(event: E): void {
  const redeemId = getTransactionId(event.transaction.hash, event.transactionLogIndex);

  const redeem = new RedeemEvent(redeemId);
  redeem.amountMantissa = event.params.redeemTokens;
  redeem.to = event.address;
  redeem.from = event.params.redeemer;
  redeem.blockNumber = event.block.number.toI32();
  redeem.blockTime = event.block.timestamp.toI32();
  redeem.vTokenAddress = event.address;
  redeem.underlyingAmountMantissa = event.params.redeemAmount;
  redeem.save();
}
