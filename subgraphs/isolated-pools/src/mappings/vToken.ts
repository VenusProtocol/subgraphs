import { Address } from '@graphprotocol/graph-ts';

import {
  AccrueInterest,
  BadDebtIncreased,
  BadDebtRecovered,
  Borrow,
  HealBorrow,
  LiquidateBorrow,
  Mint,
  NewAccessControlManager,
  NewMarketInterestRateModel,
  NewReserveFactor,
  ProtocolSeize,
  Redeem,
  RepayBorrow,
  ReservesAdded,
  SpreadReservesReduced,
  Transfer,
} from '../../generated/PoolRegistry/VToken';
import { VToken as VTokenContract } from '../../generated/PoolRegistry/VToken';
import { nullAddress } from '../constants/addresses';
import { zeroBigInt32 } from '../constants/index';
import {
  createMarketPositionBadDebt,
  createBorrowTransaction,
  createLiquidateBorrowTransaction,
  createMintTransaction,
  createRedeemTransaction,
  createRepayBorrowTransaction,
  createTransferTransaction,
} from '../operations/create';
import { getMarket } from '../operations/get';
import { getOrCreateAccount } from '../operations/getOrCreate';
import {
  updateMarketPositionBorrow,
  updateMarketPositionSupply,
  updateMarket,
} from '../operations/update';

/* Account supplies assets into market and receives vTokens in exchange
 *
 * event.mintAmount is the underlying asset
 * event.mintTokens is the amount of vTokens minted
 * event.minter is the account
 *
 * Notes
 *    Mints originate from the vToken address, not 0x000000, which is typical of ERC-20s
 *    AccrueInterest is emitted before Mint
 *    Transfer event is emitted after Mint if successful
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this
 */
export function handleMint(event: Mint): void {
  const vTokenAddress = event.address;
  createMintTransaction(event);

  // we read the current total amount of supplied tokens by this account in the market
  const suppliedTotal = event.params.accountBalance;
  updateMarketPositionSupply(event.params.minter, vTokenAddress, event.block.number, suppliedTotal);

  // and finally we update the market total supply
  const vTokenContract = VTokenContract.bind(vTokenAddress);
  const market = getMarket(vTokenAddress)!;
  market.totalSupplyVTokenMantissa = vTokenContract.totalSupply();
  market.save();
}

/*  Account supplies vTokens into market and receives underlying asset in exchange
 *
 *  event.redeemAmount is the underlying asset
 *  event.redeemTokens is the vTokens
 *  event.redeemer is the account
 *
 *  Notes
 *    Transfer event will always get emitted with this
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this
 */
export function handleRedeem(event: Redeem): void {
  const vTokenAddress = event.address;
  createRedeemTransaction(event);
  // we read the account's balance and...
  const currentBalance = event.params.accountBalance;
  const marketPosition = updateMarketPositionSupply(
    event.params.redeemer,
    vTokenAddress,
    event.block.number,
    currentBalance,
  );
  marketPosition.totalUnderlyingRedeemedMantissa =
    marketPosition.totalUnderlyingRedeemedMantissa.plus(event.params.redeemAmount);
  // and finally we update the market total supply
  const vTokenContract = VTokenContract.bind(vTokenAddress);
  const market = getMarket(vTokenAddress)!;
  market.totalSupplyVTokenMantissa = vTokenContract.totalSupply();
  market.save();
}

/* Borrow assets from the protocol. All values either BNB or BEP20
 *
 * event.params.totalBorrows = of the whole market (not used right now)
 * event.params.accountBorrows = total of the account
 * event.params.borrowAmount = that was added in this event
 * event.params.borrower = the account
 * Notes
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this
 */
export function handleBorrow(event: Borrow): void {
  const vTokenAddress = event.address;

  updateMarketPositionBorrow(
    event.params.borrower,
    vTokenAddress,
    event.block.number,
    event.params.accountBorrows,
  );

  createBorrowTransaction(event);

  const market = getMarket(vTokenAddress)!;

  market.totalBorrowsMantissa = event.params.totalBorrows;
  market.save();
}

/* Repay some amount borrowed. Anyone can repay anyones balance
 *
 * event.params.totalBorrows = of the whole market (not used right now)
 * event.params.accountBorrows = total of the account (not used right now)
 * event.params.repayAmount = that was added in this event
 * event.params.borrower = the borrower
 * event.params.payer = the payer
 *
 * Notes
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this
 *    Once a account totally repays a borrow, it still has its account interest index set to the
 *    markets value. We keep this, even though you might think it would reset to 0 upon full
 *    repay.
 */
export function handleRepayBorrow(event: RepayBorrow): void {
  const vTokenAddress = event.address;
  // Its possible to call repayborrow was called without having previously borrowed
  const marketPosition = updateMarketPositionBorrow(
    event.params.borrower,
    vTokenAddress,
    event.block.number,
    event.params.accountBorrows,
  );
  const market = getMarket(vTokenAddress)!;
  market.totalBorrowsMantissa = event.params.totalBorrows;
  market.save();

  marketPosition.totalUnderlyingRepaidMantissa = marketPosition.totalUnderlyingRepaidMantissa.plus(
    event.params.repayAmount,
  );
  createRepayBorrowTransaction(event);
}

/*
 * Liquidate an account who has fell below the collateral factor.
 *
 * event.params.borrower - the borrower who is getting liquidated of their vTokens
 * event.params.vTokenCollateral - the market ADDRESS of the vtoken being liquidated
 * event.params.liquidator - the liquidator
 * event.params.repayAmount - the amount of underlying to be repaid
 * event.params.seizeTokens - vTokens seized (transfer event should handle this)
 *
 * Notes
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this.
 *    When calling this const, event RepayBorrow, and event Transfer will be called every
 *    time. This means we can ignore repayAmount. Seize tokens only changes state
 *    of the vTokens, which is covered by transfer. Therefore we only
 *    add liquidation counts in this handler.
 */
export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  const vTokenAddress = event.address;
  const market = getMarket(vTokenAddress)!;
  const vTokenContract = VTokenContract.bind(vTokenAddress);
  const liquidator = getOrCreateAccount(event.params.liquidator);
  liquidator.countLiquidator = liquidator.countLiquidator + 1;
  liquidator.save();

  const borrower = getOrCreateAccount(event.params.borrower);
  borrower.countLiquidated = borrower.countLiquidated + 1;
  borrower.save();

  market.totalSupplyVTokenMantissa = vTokenContract.totalSupply();
  market.save();

  createLiquidateBorrowTransaction(event);
}

export function handleProtocolSeize(event: ProtocolSeize): void {
  const vTokenAddress = event.address;
  const market = getMarket(vTokenAddress)!;
  const vTokenContract = VTokenContract.bind(vTokenAddress);
  market.totalSupplyVTokenMantissa = vTokenContract.totalSupply();
  market.save();
}

export function handleAccrueInterest(event: AccrueInterest): void {
  const market = updateMarket(event.address, event.block.number);
  market.totalBorrowsMantissa = event.params.totalBorrows;
  market.borrowIndex = event.params.borrowIndex;
  market.save();
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  const vTokenAddress = event.address;
  const market = getMarket(vTokenAddress)!;
  market.reserveFactorMantissa = event.params.newReserveFactorMantissa;
  market.save();
}

/* Transferring of vTokens
 *
 * event.params.from = sender of vTokens
 * event.params.to = receiver of vTokens
 * event.params.amount = amount sent
 *
 * Notes
 *    Possible ways to emit Transfer:
 *      seize() - i.e. a Liquidation Transfer (does not emit anything else)
 *      redeemFresh() - i.e. redeeming your vTokens for underlying asset
 *      mintFresh() - i.e. you are lending underlying assets to create vtokens
 *      transfer() - i.e. a basic transfer
 *    This const handles all 4 cases. Transfer is emitted alongside the mint, redeem, and seize
 *    events. So for those events, we do not update vToken balances.
 */
export function handleTransfer(event: Transfer): void {
  // We only updateMarket() if accrual block number is not up to date. This will only happen
  // with normal transfers, since mint, redeem, and seize transfers will already run updateMarket()
  updateMarket(event.address, event.block.number);
  const accountFromAddress = event.params.from;
  const accountToAddress = event.params.to;
  // Checking if the event is FROM the vToken contract or null (i.e. this will not run when minting)
  // Checking if the event is TO the vToken contract (i.e. this will not run when redeeming)
  // @TODO Edge case where someone who accidentally sends vTokens to a vToken contract, where it will not get recorded.
  const vTokenContract = VTokenContract.bind(event.address);

  if (
    accountFromAddress.notEqual(nullAddress) &&
    accountFromAddress.notEqual(event.address) &&
    accountToAddress.notEqual(event.address)
  ) {
    getOrCreateAccount(accountFromAddress);
    updateMarketPositionSupply(
      accountFromAddress,
      event.address,
      event.block.number,
      vTokenContract.balanceOf(accountFromAddress),
    );
  }

  if (
    event.params.amount.gt(zeroBigInt32) &&
    accountToAddress.notEqual(nullAddress) &&
    accountFromAddress.notEqual(nullAddress) &&
    accountFromAddress.notEqual(event.address) &&
    accountToAddress.notEqual(event.address)
  ) {
    getOrCreateAccount(accountToAddress);
    updateMarketPositionSupply(
      accountToAddress,
      event.address,
      event.block.number,
      vTokenContract.balanceOf(accountToAddress),
    );
  }

  createTransferTransaction(event);
}

export function handleNewMarketInterestRateModel(event: NewMarketInterestRateModel): void {
  const vTokenAddress = event.address;
  const market = getMarket(vTokenAddress)!;
  market.interestRateModelAddress = event.params.newInterestRateModel;
  market.save();
}

export function handleBadDebtIncreased(event: BadDebtIncreased): void {
  const vTokenAddress = event.address;
  const market = getMarket(vTokenAddress)!;
  market.badDebtMantissa = event.params.badDebtNew;
  market.save();

  createMarketPositionBadDebt(vTokenAddress, event);
}

export function handleBadDebtRecovered(event: BadDebtRecovered): void {
  const vTokenAddress = event.address;
  const market = getMarket(vTokenAddress)!;
  market.badDebtMantissa = event.params.badDebtNew;
  market.save();
}

export function handleNewAccessControlManager(event: NewAccessControlManager): void {
  const vTokenAddress = event.address;
  const market = getMarket(vTokenAddress)!;
  market.accessControlManagerAddress = event.params.newAccessControlManager;
  market.save();
}

export function handleReservesAdded(event: ReservesAdded): void {
  const vTokenAddress = event.address;
  const market = getMarket(vTokenAddress)!;
  market.reservesMantissa = event.params.newTotalReserves;
  market.save();
}

export function handleSpreadReservesReduced(event: SpreadReservesReduced): void {
  const vTokenAddress = event.address;
  const market = getMarket(vTokenAddress)!;
  market.reservesMantissa = event.params.newTotalReserves;
  market.save();
}

export function handleHealBorrow(event: HealBorrow): void {
  const vTokenAddress = event.address;
  updateMarketPositionBorrow(
    event.params.borrower,
    Address.fromBytes(vTokenAddress),
    event.block.number,
    zeroBigInt32,
  );
  const vTokenContract = VTokenContract.bind(vTokenAddress);
  const market = getMarket(vTokenAddress)!;
  market.totalBorrowsMantissa = vTokenContract.totalBorrows();
  market.save();
}
