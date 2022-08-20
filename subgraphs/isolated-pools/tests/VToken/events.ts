import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  Borrow as BorrowEvent,
  Mint as MintEvent,
  Redeem as RedeemEvent,
} from '../../generated/PoolRegistry/VToken';

export const createMintEvent = (
  vTokenAddress: Address,
  minterAddress: Address,
  mintAmount: BigInt,
  mintTokens: BigInt,
): MintEvent => {
  const event = changetype<MintEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const minterParam = new ethereum.EventParam('minter', ethereum.Value.fromAddress(minterAddress));
  event.parameters.push(minterParam);

  const mintAmountParam = new ethereum.EventParam(
    'mintAmount',
    ethereum.Value.fromUnsignedBigInt(mintAmount),
  );
  event.parameters.push(mintAmountParam);

  const mintTokensParam = new ethereum.EventParam(
    'mintTokens',
    ethereum.Value.fromUnsignedBigInt(mintTokens),
  );
  event.parameters.push(mintTokensParam);

  return event;
};

export const createRedeemEvent = (
  vTokenAddress: Address,
  redeemerAddress: Address,
  redeemAmount: BigInt,
  redeemTokens: BigInt,
): RedeemEvent => {
  const event = changetype<RedeemEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const redeemerParam = new ethereum.EventParam(
    'redeemer',
    ethereum.Value.fromAddress(redeemerAddress),
  );
  event.parameters.push(redeemerParam);

  const redeemAmountParam = new ethereum.EventParam(
    'redeemAmount',
    ethereum.Value.fromUnsignedBigInt(redeemAmount),
  );
  event.parameters.push(redeemAmountParam);

  const redeemTokensParam = new ethereum.EventParam(
    'redeemTokens',
    ethereum.Value.fromUnsignedBigInt(redeemTokens),
  );
  event.parameters.push(redeemTokensParam);

  return event;
};

export const createBorrowEvent = (
  vTokenAddress: Address,
  borrowerAddress: Address,
  borrowAmount: BigInt,
  accountBorrows: BigInt,
  totalBorrows: BigInt,
): BorrowEvent => {
  const event = changetype<BorrowEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const borrowerParam = new ethereum.EventParam(
    'borrower',
    ethereum.Value.fromAddress(borrowerAddress),
  );
  event.parameters.push(borrowerParam);

  const borrowAmountParam = new ethereum.EventParam(
    'borrowAmount',
    ethereum.Value.fromUnsignedBigInt(borrowAmount),
  );
  event.parameters.push(borrowAmountParam);

  const accountBorrowsParam = new ethereum.EventParam(
    'accountBorrows',
    ethereum.Value.fromUnsignedBigInt(accountBorrows),
  );
  event.parameters.push(accountBorrowsParam);

  const totalBorrowsParam = new ethereum.EventParam(
    'totalBorrows',
    ethereum.Value.fromUnsignedBigInt(totalBorrows),
  );
  event.parameters.push(totalBorrowsParam);

  return event;
};
