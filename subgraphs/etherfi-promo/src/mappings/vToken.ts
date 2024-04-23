import { Address } from '@graphprotocol/graph-ts';

import {
  AccrueInterest,
  Borrow,
  Mint,
  Redeem,
  RepayBorrow,
  Transfer,
} from '../../generated/vWeETH/VToken';
import { VToken as VTokenContract } from '../../generated/vWeETH/VToken';
import { nullAddress } from '../constants';
import { vWeEthAddress } from '../constants/addresses';
import { createBorrowerAccount, createSupplierAccount } from '../operations/create';
import { getBorrow, getBorrowerAccount, getSupplierAccount, getSupply } from '../operations/get';
import { updateBorrowerAccount, updateSupplierAccount, updateTvl } from '../operations/update';
import exponentToBigInt from '../utilities/exponentToBigInt';

export function handleMint(event: Mint): void {
  const minter = event.params.minter;
  const supplierAccount = getSupplierAccount(minter);
  if (supplierAccount) {
    updateSupplierAccount(minter, supplierAccount.effective_balance.plus(event.params.mintAmount));
  } else {
    createSupplierAccount(minter, event.params.mintAmount);
  }
}

export function handleRedeem(event: Redeem): void {
  const redeemer = event.params.redeemer;
  const supplierAccount = getSupplierAccount(redeemer)!;
  updateSupplierAccount(
    redeemer,
    supplierAccount.effective_balance.minus(event.params.redeemAmount),
  );
}

export function handleBorrow(event: Borrow): void {
  const borrower = event.params.borrower;
  const borrowerAccount = getBorrowerAccount(borrower);
  if (!borrowerAccount) {
    createBorrowerAccount(borrower, event.params.accountBorrows);
  }
}

export function handleRepayBorrow(event: RepayBorrow): void {
  const borrower = event.params.borrower;
  updateBorrowerAccount(borrower, event.params.accountBorrows);
}

export function handleTransfer(event: Transfer): void {
  // Checking if the tx is FROM the vToken contract (i.e. this will not run when minting)
  // If so, it is a mint, and we don't need to run these calculations
  const fromAccountAddress = event.params.from;
  // If the to account is the vToken address we assume it was a redeem
  const toAccountAddress = event.params.to;

  if (
    fromAccountAddress != nullAddress &&
    fromAccountAddress != event.address &&
    toAccountAddress != event.address
  ) {
    const vTokenContract = VTokenContract.bind(event.address);
    const exchangeRateMantissa = vTokenContract.exchangeRateCurrent();
    const amountUnderlying = exchangeRateMantissa
      .times(event.params.amount)
      .div(exponentToBigInt(18));
    const fromAccount = getSupplierAccount(fromAccountAddress)!;
    updateSupplierAccount(
      fromAccountAddress,
      fromAccount.effective_balance.minus(amountUnderlying),
    );
    // To
    const toAccount = getSupplierAccount(toAccountAddress);
    if (toAccount) {
      updateSupplierAccount(toAccountAddress, toAccount.effective_balance.plus(amountUnderlying));
    } else if (toAccountAddress != event.address) {
      createSupplierAccount(toAccountAddress, amountUnderlying);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleAccrueInterest(event: AccrueInterest): void {
  const supply = getSupply();
  supply.suppliers.load().forEach(supplier => {
    const vTokenContract = VTokenContract.bind(vWeEthAddress);

    const exchangeRateMantissa = vTokenContract.exchangeRateCurrent();
    const vTokenBalance = vTokenContract.balanceOf(Address.fromBytes(supplier.address));
    const amountUnderlying = exchangeRateMantissa.times(vTokenBalance).div(exponentToBigInt(18));
    supplier.effective_balance = amountUnderlying;
    supplier.save();
  });

  const borrow = getBorrow();
  borrow.borrowers.load().forEach(borrower => {
    const vTokenContract = VTokenContract.bind(vWeEthAddress);
    const underlyingBorrowBalance = vTokenContract.borrowBalanceStored(
      Address.fromBytes(borrower.address),
    );
    borrower.effective_balance = underlyingBorrowBalance;
    borrower.save();
  });

  updateTvl();
}
