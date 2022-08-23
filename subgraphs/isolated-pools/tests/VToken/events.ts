import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  AccrueInterest as AccrueInterestEvent,
  Borrow as BorrowEvent,
  LiquidateBorrow as LiquidateBorrowEvent,
  Mint as MintEvent,
  NewMarketInterestRateModel as NewMarketInterestRateModelEvent,
  NewReserveFactor as NewReserveFactorEvent,
  Redeem as RedeemEvent,
  RepayBorrow as RepayBorrowEvent,
  Transfer as TransferEvent,
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
    'totalBorrows',
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
    'cTokenCollateral',
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
    'borrowIndex',
    ethereum.Value.fromUnsignedBigInt(borrowIndex),
  );
  event.parameters.push(borrowIndexParam);

  const totalBorrowsParam = new ethereum.EventParam(
    'totalBorrows',
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
