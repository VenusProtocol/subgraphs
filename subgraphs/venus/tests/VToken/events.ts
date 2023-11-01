import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import { MarketListed as MarketListedEvent } from '../../generated/Comptroller/Comptroller';
import {
  AccrueInterest as AccrueInterestEvent,
  Approval as ApprovalEvent,
  Borrow as BorrowEvent,
  LiquidateBorrow as LiquidateBorrowEvent,
  MintBehalf as MintBehalfEventV1,
  Mint as MintEventV1,
  NewComptroller as NewComptrollerEvent,
  NewMarketInterestRateModel as NewMarketInterestRateModelEvent,
  NewReserveFactor as NewReserveFactorEvent,
  Redeem as RedeemEventV1,
  RepayBorrow as RepayBorrowEvent,
  Transfer as TransferEvent,
} from '../../generated/templates/VToken/VToken';
import {
  MintBehalf as MintBehalfEvent,
  Mint as MintEvent,
  Redeem as RedeemEvent,
} from '../../generated/templates/VTokenUpdatedEvents/VTokenUpdatedEvents';

export const createMarketListedEvent = (vTokenAddress: Address): MarketListedEvent => {
  const event = changetype<MarketListedEvent>(newMockEvent());

  event.parameters = [];
  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  return event;
};

export const createMintEvent = (
  vTokenAddress: Address,
  minterAddress: Address,
  mintAmount: BigInt,
  mintTokens: BigInt,
  accountBalance: BigInt,
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

  const accountBalanceParam = new ethereum.EventParam(
    'accountBalance',
    ethereum.Value.fromUnsignedBigInt(accountBalance),
  );
  event.parameters.push(accountBalanceParam);

  return event;
};

export const createRedeemEvent = (
  vTokenAddress: Address,
  redeemerAddress: Address,
  redeemAmount: BigInt,
  redeemTokens: BigInt,
  accountBalance: BigInt,
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

  const accountBalanceParam = new ethereum.EventParam(
    'accountBalance',
    ethereum.Value.fromUnsignedBigInt(accountBalance),
  );
  event.parameters.push(accountBalanceParam);

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
    'totalBorrowsMantissa',
    ethereum.Value.fromUnsignedBigInt(totalBorrows),
  );
  event.parameters.push(totalBorrowsParam);

  return event;
};

export const createRepayBorrowEvent = (
  vTokenAddress: Address,
  payerAddress: Address,
  borrowerAddress: Address,
  repayAmount: BigInt,
  accountBorrows: BigInt,
  totalBorrows: BigInt,
): RepayBorrowEvent => {
  const event = changetype<RepayBorrowEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const payerParam = new ethereum.EventParam('payer', ethereum.Value.fromAddress(payerAddress));
  event.parameters.push(payerParam);

  const borrowerParam = new ethereum.EventParam(
    'borrower',
    ethereum.Value.fromAddress(borrowerAddress),
  );
  event.parameters.push(borrowerParam);

  const repayAmountParam = new ethereum.EventParam(
    'repayAmount',
    ethereum.Value.fromUnsignedBigInt(repayAmount),
  );
  event.parameters.push(repayAmountParam);

  const accountBorrowsParam = new ethereum.EventParam(
    'accountBorrows',
    ethereum.Value.fromUnsignedBigInt(accountBorrows),
  );
  event.parameters.push(accountBorrowsParam);

  const totalBorrowsParam = new ethereum.EventParam(
    'totalBorrowsMantissa',
    ethereum.Value.fromUnsignedBigInt(totalBorrows),
  );
  event.parameters.push(totalBorrowsParam);

  return event;
};

export const createLiquidateBorrowEvent = (
  vTokenAddress: Address,
  liquidatorAddress: Address,
  borrowerAddress: Address,
  repayAmount: BigInt,
  vTokenCollateral: Address,
  seizeTokens: BigInt,
): LiquidateBorrowEvent => {
  const event = changetype<LiquidateBorrowEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const liquidatorParam = new ethereum.EventParam(
    'liquidator',
    ethereum.Value.fromAddress(liquidatorAddress),
  );
  event.parameters.push(liquidatorParam);

  const borrowerParam = new ethereum.EventParam(
    'borrower',
    ethereum.Value.fromAddress(borrowerAddress),
  );
  event.parameters.push(borrowerParam);

  const repayAmountParam = new ethereum.EventParam(
    'repayAmount',
    ethereum.Value.fromUnsignedBigInt(repayAmount),
  );
  event.parameters.push(repayAmountParam);

  const vTokenCollateralParam = new ethereum.EventParam(
    'vTokenCollateral',
    ethereum.Value.fromAddress(vTokenCollateral),
  );
  event.parameters.push(vTokenCollateralParam);

  const seizeTokensParam = new ethereum.EventParam(
    'seizeTokens',
    ethereum.Value.fromUnsignedBigInt(seizeTokens),
  );
  event.parameters.push(seizeTokensParam);

  return event;
};

export const createAccrueInterestEvent = (
  vTokenAddress: Address,
  cashPrior: BigInt,
  interestAccumulated: BigInt,
  borrowIndex: BigInt,
  totalBorrows: BigInt,
): AccrueInterestEvent => {
  const event = changetype<AccrueInterestEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const cashPriorParam = new ethereum.EventParam(
    'cashPrior',
    ethereum.Value.fromUnsignedBigInt(cashPrior),
  );
  event.parameters.push(cashPriorParam);

  const interestAccumulatedParam = new ethereum.EventParam(
    'interestAccumulated',
    ethereum.Value.fromUnsignedBigInt(interestAccumulated),
  );
  event.parameters.push(interestAccumulatedParam);

  const borrowIndexParam = new ethereum.EventParam(
    'borrowIndexMantissa',
    ethereum.Value.fromUnsignedBigInt(borrowIndex),
  );
  event.parameters.push(borrowIndexParam);

  const totalBorrowsParam = new ethereum.EventParam(
    'totalBorrowsMantissa',
    ethereum.Value.fromUnsignedBigInt(totalBorrows),
  );
  event.parameters.push(totalBorrowsParam);

  return event;
};

export const createNewReserveFactorEvent = (
  vTokenAddress: Address,
  oldReserveFactorMantissa: BigInt,
  newReserveFactorMantissa: BigInt,
): NewReserveFactorEvent => {
  const event = changetype<NewReserveFactorEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const oldReserveFactorMantissaParam = new ethereum.EventParam(
    'oldReserveFactorMantissa',
    ethereum.Value.fromUnsignedBigInt(oldReserveFactorMantissa),
  );
  event.parameters.push(oldReserveFactorMantissaParam);

  const newReserveFactorMantissaParam = new ethereum.EventParam(
    'newReserveFactorMantissa',
    ethereum.Value.fromUnsignedBigInt(newReserveFactorMantissa),
  );
  event.parameters.push(newReserveFactorMantissaParam);

  return event;
};

export const createTransferEvent = (
  vTokenAddress: Address,
  from: Address,
  to: Address,
  amount: BigInt,
): TransferEvent => {
  const event = changetype<TransferEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const fromParam = new ethereum.EventParam('from', ethereum.Value.fromAddress(from));
  event.parameters.push(fromParam);

  const toParam = new ethereum.EventParam('to', ethereum.Value.fromAddress(to));
  event.parameters.push(toParam);

  const amountParam = new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(amount));
  event.parameters.push(amountParam);

  return event;
};

export const createNewMarketInterestRateModelEvent = (
  vTokenAddress: Address,
  oldInterestRateModel: Address,
  newInterestRateModel: Address,
): NewMarketInterestRateModelEvent => {
  const event = changetype<NewMarketInterestRateModelEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const oldInterestRateModelParam = new ethereum.EventParam(
    'oldInterestRateModel',
    ethereum.Value.fromAddress(oldInterestRateModel),
  );
  event.parameters.push(oldInterestRateModelParam);

  const newInterestRateModelParam = new ethereum.EventParam(
    'newInterestRateModel',
    ethereum.Value.fromAddress(newInterestRateModel),
  );
  event.parameters.push(newInterestRateModelParam);

  return event;
};

export const createApprovalEvent = (
  vTokenAddress: Address,
  owner: Address,
  spender: Address,
  amount: BigInt,
): ApprovalEvent => {
  const event = changetype<ApprovalEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const ownerParam = new ethereum.EventParam('owner', ethereum.Value.fromAddress(owner));
  event.parameters.push(ownerParam);

  const spenderParam = new ethereum.EventParam('spender', ethereum.Value.fromAddress(spender));
  event.parameters.push(spenderParam);

  const amountParam = new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(amount));
  event.parameters.push(amountParam);

  return event;
};

export const createNewComptrollerEvent = (
  vTokenAddress: Address,
  oldComptroller: Address,
  newComptroller: Address,
): NewComptrollerEvent => {
  const event = changetype<NewComptrollerEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const oldComptrollerParam = new ethereum.EventParam(
    'oldComptroller',
    ethereum.Value.fromAddress(oldComptroller),
  );
  event.parameters.push(oldComptrollerParam);

  const newComptrollerParam = new ethereum.EventParam(
    'newComptroller',
    ethereum.Value.fromAddress(newComptroller),
  );
  event.parameters.push(newComptrollerParam);

  return event;
};

export const createMintEventV1 = (
  vTokenAddress: Address,
  minterAddress: Address,
  mintAmount: BigInt,
  mintTokens: BigInt,
): MintEventV1 => {
  const event = changetype<MintEventV1>(newMockEvent());
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
export const createMintBehalfEvent = (
  vTokenAddress: Address,
  payerAddress: Address,
  receiverAddress: Address,
  mintAmount: BigInt,
  mintTokens: BigInt,
  totalSupply: BigInt,
): MintBehalfEvent => {
  const event = changetype<MintBehalfEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const payerParam = new ethereum.EventParam('minter', ethereum.Value.fromAddress(payerAddress));
  event.parameters.push(payerParam);

  const receiverParam = new ethereum.EventParam(
    'minter',
    ethereum.Value.fromAddress(receiverAddress),
  );
  event.parameters.push(receiverParam);

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

  const totalSupplyParam = new ethereum.EventParam(
    'totalSupply',
    ethereum.Value.fromUnsignedBigInt(totalSupply),
  );
  event.parameters.push(totalSupplyParam);

  return event;
};
export const createMintBehalfEventV1 = (
  vTokenAddress: Address,
  payerAddress: Address,
  receiverAddress: Address,
  mintAmount: BigInt,
  mintTokens: BigInt,
): MintBehalfEventV1 => {
  const event = changetype<MintBehalfEventV1>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const payerParam = new ethereum.EventParam('minter', ethereum.Value.fromAddress(payerAddress));
  event.parameters.push(payerParam);

  const receiverParam = new ethereum.EventParam(
    'minter',
    ethereum.Value.fromAddress(receiverAddress),
  );
  event.parameters.push(receiverParam);

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

export const createRedeemEventV1 = (
  vTokenAddress: Address,
  redeemerAddress: Address,
  redeemAmount: BigInt,
  redeemTokens: BigInt,
): RedeemEventV1 => {
  const event = changetype<RedeemEventV1>(newMockEvent());
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
