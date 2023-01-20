import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  AccrueInterest as AccrueInterestEvent,
  Approval as ApprovalEvent,
  BadDebtIncreased as BadDebtIncreasedEvent,
  Borrow as BorrowEvent,
  LiquidateBorrow as LiquidateBorrowEvent,
  Mint as MintEvent,
  NewAccessControlManager as NewAccessControlManagerEvent,
  NewComptroller as NewComptrollerEvent,
  NewMarketInterestRateModel as NewMarketInterestRateModelEvent,
  NewReserveFactor as NewReserveFactorEvent,
  Redeem as RedeemEvent,
  RepayBorrow as RepayBorrowEvent,
  ReservesAdded as ReservesAddedEvent,
  ReservesReduced as ReservesReducedEvent,
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

export const createBadDebtIncreasedEvent = (
  vTokenAddress: Address,
  borrower: Address,
  badDebtDelta: BigInt,
  badDebtOld: BigInt,
  badDebtNew: BigInt,
): BadDebtIncreasedEvent => {
  const event = changetype<BadDebtIncreasedEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const borrowerParam = new ethereum.EventParam('borrower', ethereum.Value.fromAddress(borrower));
  event.parameters.push(borrowerParam);

  const badDebtDeltaParam = new ethereum.EventParam(
    'badDebtDelta',
    ethereum.Value.fromUnsignedBigInt(badDebtDelta),
  );
  event.parameters.push(badDebtDeltaParam);

  const badDebtOldParam = new ethereum.EventParam(
    'badDebtOld',
    ethereum.Value.fromUnsignedBigInt(badDebtOld),
  );
  event.parameters.push(badDebtOldParam);

  const badDebtNewParam = new ethereum.EventParam(
    'badDebtNew',
    ethereum.Value.fromUnsignedBigInt(badDebtNew),
  );
  event.parameters.push(badDebtNewParam);

  return event;
};

export const createNewAccessControlManagerEvent = (
  vTokenAddress: Address,
  oldAccessControlManager: Address,
  newAccessControlManager: Address,
): NewAccessControlManagerEvent => {
  const event = changetype<NewAccessControlManagerEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const oldAccessControlManagerParam = new ethereum.EventParam(
    'oldAccessControlManager',
    ethereum.Value.fromAddress(oldAccessControlManager),
  );
  event.parameters.push(oldAccessControlManagerParam);

  const newAccessControlManagerParam = new ethereum.EventParam(
    'newAccessControlManager',
    ethereum.Value.fromAddress(newAccessControlManager),
  );
  event.parameters.push(newAccessControlManagerParam);

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

export const createReservesAddedEvent = (
  vTokenAddress: Address,
  benefactor: Address,
  addAmount: BigInt,
  newTotalReserves: BigInt,
): ReservesAddedEvent => {
  const event = changetype<ReservesAddedEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const benefactorParam = new ethereum.EventParam(
    'benefactor',
    ethereum.Value.fromAddress(benefactor),
  );
  event.parameters.push(benefactorParam);

  const addAmountParam = new ethereum.EventParam(
    'addAmount',
    ethereum.Value.fromUnsignedBigInt(addAmount),
  );
  event.parameters.push(addAmountParam);

  const newTotalReservesParam = new ethereum.EventParam(
    'newTotalReserves',
    ethereum.Value.fromUnsignedBigInt(newTotalReserves),
  );
  event.parameters.push(newTotalReservesParam);

  return event;
};

export const createReservesReducedEvent = (
  vTokenAddress: Address,
  benefactor: Address,
  reduceAmount: BigInt,
  newTotalReserves: BigInt,
): ReservesReducedEvent => {
  const event = changetype<ReservesReducedEvent>(newMockEvent());
  event.address = vTokenAddress;
  event.parameters = [];

  const benefactorParam = new ethereum.EventParam(
    'benefactor',
    ethereum.Value.fromAddress(benefactor),
  );
  event.parameters.push(benefactorParam);

  const reduceAmountParam = new ethereum.EventParam(
    'reduceAmount',
    ethereum.Value.fromUnsignedBigInt(reduceAmount),
  );
  event.parameters.push(reduceAmountParam);

  const newTotalReservesParam = new ethereum.EventParam(
    'newTotalReserves',
    ethereum.Value.fromUnsignedBigInt(newTotalReserves),
  );
  event.parameters.push(newTotalReservesParam);

  return event;
};
