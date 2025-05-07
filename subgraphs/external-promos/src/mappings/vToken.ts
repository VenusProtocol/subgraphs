import { Address } from '@graphprotocol/graph-ts';

import { AccrueInterest, Borrow, Mint, Transfer } from '../../generated/vWeETH/VToken';
import { VToken as VTokenContract } from '../../generated/vWeETH/VToken';
import { nullAddress } from '../constants';
import { getBorrow, getSupply } from '../operations/get';
import { getOrCreateBorrowerAccount, getOrCreateSupplierAccount } from '../operations/getOrCreate';
import { updateBorrowerAccount, updateSupplierAccount, updateTvl } from '../operations/update';
import { calculateUnderlyingAmountFromBorrowEvent } from '../utilities/calculateUnderlyingAmountFromBorrowEvent';
import { calculateUnderlyingAmountFromMintEvent } from '../utilities/calculateUnderlyingAmountFromMintEvent';
import { calculateUnderlyingAmountFromVTokenAmount } from '../utilities/calculateUnderlyingAmountFromVTokenAmount';

export function handleMint(event: Mint): void {
  const minter = event.params.minter;
  const supplierAccount = getOrCreateSupplierAccount(minter, event.address);
  const vToken = getSupply(event.address);
  updateSupplierAccount(
    minter,
    event.address,
    supplierAccount.effective_balance.plus(
      calculateUnderlyingAmountFromMintEvent(event.params.mintAmount.toBigDecimal(), vToken),
    ),
  );
}

export function handleBorrow(event: Borrow): void {
  const borrower = event.params.borrower;
  const vToken = getBorrow(event.address);
  getOrCreateBorrowerAccount(borrower, event.address);
  updateBorrowerAccount(
    borrower,
    event.address,
    calculateUnderlyingAmountFromBorrowEvent(event.params.accountBorrows.toBigDecimal(), vToken),
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
    const amountUnderlying = calculateUnderlyingAmountFromVTokenAmount(
      event.params.amount,
      event.address,
    );
    const fromAccount = getOrCreateSupplierAccount(fromAccountAddress, event.address);
    updateSupplierAccount(
      fromAccountAddress,
      event.address,
      fromAccount.effective_balance.minus(amountUnderlying),
    );
    // To
    const toAccount = getOrCreateSupplierAccount(toAccountAddress, event.address);
    updateSupplierAccount(
      toAccountAddress,
      event.address,
      toAccount.effective_balance.plus(amountUnderlying),
    );
  }
}

export function handleAccrueInterest(event: AccrueInterest): void {
  const supply = getSupply(event.address);
  supply.suppliers.load().forEach(supplier => {
    const vTokenContract = VTokenContract.bind(Address.fromBytes(supplier.token));

    const vTokenBalance = vTokenContract.balanceOf(Address.fromBytes(supplier.address));
    const amountUnderlying = calculateUnderlyingAmountFromVTokenAmount(
      vTokenBalance,
      Address.fromBytes(supplier.token),
    );
    supplier.effective_balance = amountUnderlying;
    supplier.save();
  });

  const borrow = getBorrow(event.address);
  borrow.borrowers.load().forEach(borrower => {
    const vTokenContract = VTokenContract.bind(Address.fromBytes(borrower.token));
    const vToken = getBorrow(Address.fromBytes(borrower.token));
    const underlyingBorrowBalance = vTokenContract.borrowBalanceCurrent(
      Address.fromBytes(borrower.address),
    );
    borrower.effective_balance = calculateUnderlyingAmountFromBorrowEvent(
      underlyingBorrowBalance.toBigDecimal(),
      vToken,
    );
    borrower.save();
  });

  updateTvl(event);
}
