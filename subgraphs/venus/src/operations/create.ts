import { Address, Bytes, ethereum, log } from '@graphprotocol/graph-ts';

import {
  AccountVTokenTransaction,
  BorrowEvent,
  LiquidationEvent,
  Market,
  MintEvent,
  RedeemEvent,
  RepayEvent,
  TransferEvent,
} from '../../generated/schema';
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
import { getAccountVTokenTransactionId, getTransactionId } from '../utilities/ids';
import { getMarketId } from '../utilities/ids';
import { updateMarketCashMantissa } from './updateMarketCashMantissa';
import { updateMarketRates } from './updateMarketRates';
import { updateMarketTotalSupplyMantissa } from './updateMarketTotalSupplyMantissa';

export function createMarket(marketAddress: Address, event: ethereum.Event): Market {
  const vTokenContract = VToken.bind(marketAddress);
  const market = new Market(getMarketId(marketAddress));
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

export function createBorrowEvent<E>(event: E, underlyingAddress: Bytes): void {
  const borrowID = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const borrow = new BorrowEvent(borrowID);
  borrow.amountMantissa = event.params.borrowAmount;
  borrow.accountBorrowsMantissa = event.params.accountBorrows;
  borrow.borrower = event.params.borrower;
  borrow.blockNumber = event.block.number.toI32();
  borrow.blockTime = event.block.timestamp.toI32();
  borrow.underlyingAddress = underlyingAddress;
  borrow.save();
}

export function createRepayEvent<E>(event: E, underlyingAddress: Bytes): void {
  const repayID = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const repay = new RepayEvent(repayID);
  repay.amountMantissa = event.params.repayAmount;
  repay.accountBorrowsMantissa = event.params.accountBorrows;
  repay.borrower = event.params.borrower;
  repay.blockNumber = event.block.number.toI32();
  repay.blockTime = event.block.timestamp.toI32();
  repay.underlyingAddress = underlyingAddress;
  repay.payer = event.params.payer;
  repay.save();
}

export function createLiquidationEvent<E>(event: E, underlyingAddress: Bytes): void {
  const liquidationID = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const liquidation = new LiquidationEvent(liquidationID);
  liquidation.amountMantissa = event.params.seizeTokens;
  liquidation.to = event.params.liquidator;
  liquidation.from = event.params.borrower;
  liquidation.blockNumber = event.block.number.toI32();
  liquidation.blockTime = event.block.timestamp.toI32();
  liquidation.underlyingRepaidAddress = underlyingAddress;
  liquidation.underlyingRepayAmountMantissa = event.params.repayAmount;
  liquidation.vTokenCollateralAddress = event.params.vTokenCollateral;
  liquidation.save();
}

export function createTransferEvent<E>(event: E): void {
  const transferId = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const transfer = new TransferEvent(transferId);
  transfer.amountMantissa = event.params.amount;
  transfer.to = event.params.to;
  transfer.from = event.params.from;
  transfer.blockNumber = event.block.number.toI32();
  transfer.blockTime = event.block.timestamp.toI32();
  transfer.vTokenAddress = event.address;
  transfer.save();
}

export function createAccountVTokenTransaction(
  accountVTokenId: string,
  event: ethereum.Event,
): AccountVTokenTransaction {
  const id = getAccountVTokenTransactionId(
    accountVTokenId,
    event.transaction.hash,
    event.transactionLogIndex,
  );
  const transaction = new AccountVTokenTransaction(id);
  transaction.account = accountVTokenId;
  transaction.tx_hash = event.transaction.hash; // eslint-disable-line @typescript-eslint/naming-convention
  transaction.logIndex = event.transactionLogIndex;
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.save();
  return transaction;
}
