import { Bytes } from '@graphprotocol/graph-ts';

import {
  BorrowEvent,
  LiquidationEvent,
  MintEvent,
  RedeemEvent,
  RepayEvent,
  TransferEvent,
} from '../../generated/schema';
import { getTransactionId } from '../utilities/ids';

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
