import { Address } from '@graphprotocol/graph-ts';

import { AccrueInterest, Borrow, Mint, Transfer } from '../../generated/vWeETH/VToken';
import { VToken as VTokenContract } from '../../generated/vWeETH/VToken';
import { nullAddress } from '../constants';
import { getBorrow, getSupply } from '../operations/get';
import { getOrCreateBorrowerAccount, getOrCreateSupplierAccount } from '../operations/getOrCreate';
import { updateBorrowerAccount, updateSupplierAccount, updateTvl } from '../operations/update';
import exponentToBigDecimal from '../utilities/exponentToBigDecimal';
import exponentToBigInt from '../utilities/exponentToBigInt';

export function handleMint(event: Mint): void {
  const minter = event.params.minter;
  const supplierAccount = getOrCreateSupplierAccount(minter, event.address);
  updateSupplierAccount(
    minter,
    event.address,
    supplierAccount.effective_balance.plus(
      event.params.mintAmount.toBigDecimal().div(exponentToBigDecimal(18)),
    ),
  );
}

export function handleBorrow(event: Borrow): void {
  const borrower = event.params.borrower;
  getOrCreateBorrowerAccount(borrower, event.address);
  updateBorrowerAccount(
    borrower,
    event.address,
    event.params.accountBorrows.toBigDecimal().div(exponentToBigDecimal(18)),
  );
}

export function handleTransfer(event: Transfer): void {
  // Checking if the tx is FROM the vToken contract (i.e. this will not run when minting)
  // If so, it is a mint, and we don't need to run these calculations
  const fromAccountAddress = event.params.from;
  // If the to account is the vToken address we assume it was a redeem
  const toAccountAddress = event.params.to;

  if (
    fromAccountAddress.notEqual(event.address) &&
    fromAccountAddress.notEqual(nullAddress) &&
    toAccountAddress.notEqual(event.address)
  ) {
    const vTokenContract = VTokenContract.bind(event.address);
    const exchangeRateMantissa = vTokenContract.exchangeRateCurrent();
    const amountUnderlying = exchangeRateMantissa
      .times(event.params.amount)
      .div(exponentToBigInt(18));
    const fromAccount = getOrCreateSupplierAccount(fromAccountAddress, event.address);
    updateSupplierAccount(
      fromAccountAddress,
      event.address,
      fromAccount.effective_balance.minus(
        amountUnderlying.toBigDecimal().div(exponentToBigDecimal(18)),
      ),
    );
    // To
    const toAccount = getOrCreateSupplierAccount(toAccountAddress, event.address);
    updateSupplierAccount(
      toAccountAddress,
      event.address,
      toAccount.effective_balance.plus(
        amountUnderlying.toBigDecimal().div(exponentToBigDecimal(18)),
      ),
    );
  }
}

export function handleAccrueInterest(event: AccrueInterest): void {
  const supply = getSupply(event.address);
  supply.suppliers.load().forEach(supplier => {
    const vTokenContract = VTokenContract.bind(Address.fromBytes(supplier.token));

    const exchangeRateMantissa = vTokenContract.exchangeRateCurrent();
    const vTokenBalance = vTokenContract.balanceOf(Address.fromBytes(supplier.address));
    const amountUnderlying = exchangeRateMantissa.times(vTokenBalance).div(exponentToBigInt(18));
    supplier.effective_balance = amountUnderlying.toBigDecimal().div(exponentToBigDecimal(18));
    supplier.save();
  });

  const borrow = getBorrow(event.address);
  borrow.borrowers.load().forEach(borrower => {
    const vTokenContract = VTokenContract.bind(Address.fromBytes(borrower.token));
    const underlyingBorrowBalance = vTokenContract.borrowBalanceCurrent(
      Address.fromBytes(borrower.address),
    );
    borrower.effective_balance = underlyingBorrowBalance
      .toBigDecimal()
      .div(exponentToBigDecimal(18));
    borrower.save();
  });

  updateTvl(event);
}
