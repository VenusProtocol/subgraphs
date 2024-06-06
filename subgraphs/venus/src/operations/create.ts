import { Transaction } from '../../generated/schema';
import { BORROW, LIQUIDATE, MINT, MINT_BEHALF, REDEEM, REPAY, TRANSFER } from '../constants';
import { getTransactionId } from '../utilities/ids';

export function createMintEvent<E>(event: E): void {
  const mintId = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const transaction = new Transaction(mintId);
  transaction.type = MINT;
  transaction.amountMantissa = event.params.mintAmount;
  transaction.to = event.params.minter;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
}

export function createMintBehalfEvent<E>(event: E): void {
  const mintId = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const transaction = new Transaction(mintId);
  transaction.type = MINT_BEHALF;
  transaction.amountMantissa = event.params.mintAmount;
  transaction.to = event.params.receiver;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
}

export function createRedeemEvent<E>(event: E): void {
  const redeemId = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const transaction = new Transaction(redeemId);
  transaction.type = REDEEM;

  transaction.amountMantissa = event.params.redeemAmount;
  transaction.to = event.params.redeemer;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
}

export function createBorrowEvent<E>(event: E): void {
  const borrowId = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const transaction = new Transaction(borrowId);
  transaction.type = BORROW;

  transaction.amountMantissa = event.params.borrowAmount;
  transaction.to = event.params.borrower;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();

  transaction.save();
}

export function createRepayEvent<E>(event: E): void {
  const repayId = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const transaction = new Transaction(repayId);
  transaction.type = REPAY;

  transaction.amountMantissa = event.params.repayAmount;
  transaction.to = event.params.borrower;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
}

export function createLiquidationEvent<E>(event: E): void {
  const liquidationId = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const transaction = new Transaction(liquidationId);
  transaction.type = LIQUIDATE;

  transaction.amountMantissa = event.params.repayAmount;
  transaction.to = event.params.borrower;
  transaction.from = event.address;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
}

export function createTransferEvent<E>(event: E): void {
  const transferId = getTransactionId(event.transaction.hash, event.transactionLogIndex);
  const transaction = new Transaction(transferId);
  transaction.type = TRANSFER;
  transaction.amountMantissa = event.params.amount;
  transaction.to = event.params.to;
  transaction.from = event.params.from;
  transaction.blockNumber = event.block.number.toI32();
  transaction.blockTime = event.block.timestamp.toI32();
  transaction.save();
}
