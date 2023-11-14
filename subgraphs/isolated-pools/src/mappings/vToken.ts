import {
  AccrueInterest,
  BadDebtIncreased,
  Borrow,
  LiquidateBorrow,
  Mint,
  NewAccessControlManager,
  NewMarketInterestRateModel,
  NewReserveFactor,
  Redeem,
  RepayBorrow,
  ReservesAdded,
  ReservesReduced,
  Transfer,
} from '../../generated/PoolRegistry/VToken';
import { nullAddress } from '../constants/addresses';
import { oneBigInt, zeroBigInt32 } from '../constants/index';
import {
  createAccountVTokenBadDebt,
  createBorrowTransaction,
  createLiquidateBorrowTransaction,
  createMintTransaction,
  createRedeemTransaction,
  createRepayBorrowTransaction,
  createTransferTransaction,
} from '../operations/create';
import { getOrCreateAccount, getOrCreateMarket } from '../operations/getOrCreate';
import {
  updateAccountVTokenBorrow,
  updateAccountVTokenRepayBorrow,
  updateAccountVTokenSupply,
  updateAccountVTokenTransferFrom,
  updateAccountVTokenTransferTo,
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
 *    No need to updateCommonVTokenStats, handleTransfer() will
 *    No need to update vTokenBalance, handleTransfer() will
 */
export function handleMint(event: Mint): void {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress, null);
  createMintTransaction(event, market.underlyingDecimals, market.vTokenDecimals);

  // we read the current total amount of supplied tokens by this account in the market
  const suppliedTotal = event.params.accountBalance;
  updateAccountVTokenSupply(
    vTokenAddress,
    event.params.minter,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
    suppliedTotal,
  );
  if (suppliedTotal == event.params.mintTokens) {
    // and if they are the same, it means it's a new supplier
    market.supplierCount = market.supplierCount.plus(oneBigInt);
    market.save();
  }
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
 *    No need to updateCommonVTokenStats, handleTransfer() will
 *    No need to update vTokenBalance, handleTransfer() will
 */
export function handleRedeem(event: Redeem): void {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  createRedeemTransaction(event, market.underlyingDecimals, market.vTokenDecimals);

  // we read the account's balance and...
  const currentBalance = event.params.accountBalance;
  updateAccountVTokenSupply(
    vTokenAddress,
    event.params.redeemer,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
    currentBalance,
  );
  if (currentBalance == zeroBigInt32) {
    // if the current balance is 0 then the user has withdrawn all their assets from this market
    market.supplierCount = market.supplierCount.minus(oneBigInt);
    market.save();
  }
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
  const market = getOrCreateMarket(vTokenAddress);

  updateAccountVTokenBorrow(
    vTokenAddress,
    event.params.borrower,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
    event.params.accountBorrows,
    market.borrowIndexMantissa,
  );

  createBorrowTransaction(event, market.underlyingDecimals);

  if (event.params.accountBorrows == event.params.borrowAmount) {
    // if both the accountBorrows and the borrowAmount are the same, it means the account is a new borrower
    market.borrowerCount = market.borrowerCount.plus(oneBigInt);
    market.save();
  }
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
  const market = getOrCreateMarket(vTokenAddress);

  updateAccountVTokenRepayBorrow(
    vTokenAddress,
    event.params.borrower,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
    event.params.accountBorrows,
    market.borrowIndexMantissa,
  );

  createRepayBorrowTransaction(event, market.underlyingDecimals);

  if (event.params.accountBorrows == zeroBigInt32) {
    market.borrowerCount = market.borrowerCount.minus(oneBigInt);
    market.save();
  }
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
  const market = getOrCreateMarket(vTokenAddress);
  const liquidator = getOrCreateAccount(event.params.liquidator);
  liquidator.countLiquidator = liquidator.countLiquidator + 1;
  liquidator.save();

  const borrower = getOrCreateAccount(event.params.borrower);
  borrower.countLiquidated = borrower.countLiquidated + 1;
  borrower.save();

  createLiquidateBorrowTransaction(event, market.underlyingDecimals, market.vTokenDecimals);
}

export function handleAccrueInterest(event: AccrueInterest): void {
  updateMarket(event.address, event.block.number.toI32(), event.block.timestamp.toI32());
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
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
  const vTokenAddress = event.address;
  const accountFromAddress = event.params.from;
  const accountToAddress = event.params.to;

  let market = getOrCreateMarket(vTokenAddress);
  // We only updateMarket() if accrual block number is not up to date. This will only happen
  // with normal transfers, since mint, redeem, and seize transfers will already run updateMarket()
  if (market.accrualBlockNumber != event.block.number.toI32()) {
    market = updateMarket(event.address, event.block.number.toI32(), event.block.timestamp.toI32());
  }

  // Checking if the tx is FROM the vToken contract (i.e. this will not run when minting)
  // If so, it is a mint, and we don't need to run these calculations
  if (accountFromAddress.toHex() != nullAddress.toHex()) {
    getOrCreateAccount(accountFromAddress);

    updateAccountVTokenTransferFrom(
      vTokenAddress,
      accountFromAddress,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex,
      event.params.amount,
      market.exchangeRateMantissa,
    );
  }

  // Checking if the tx is TO the vToken contract (i.e. this will not run when redeeming)
  // If so, we ignore it. this leaves an edge case, where someone who accidentally sends
  // vTokens to a vToken contract, where it will not get recorded. Right now it would
  // be messy to include, so we are leaving it out for now TODO fix this in future
  if (accountToAddress.toHex() != vTokenAddress.toHex()) {
    getOrCreateAccount(accountToAddress);

    updateAccountVTokenTransferTo(
      vTokenAddress,
      accountToAddress,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex,
    );
  }

  createTransferTransaction(event, market.vTokenDecimals);
}

export function handleNewMarketInterestRateModel(event: NewMarketInterestRateModel): void {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  market.interestRateModelAddress = event.params.newInterestRateModel;
  market.save();
}

export function handleBadDebtIncreased(event: BadDebtIncreased): void {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  market.badDebtMantissa = event.params.badDebtNew;
  market.save();

  createAccountVTokenBadDebt(vTokenAddress, event);
}

export function handleNewAccessControlManager(event: NewAccessControlManager): void {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  market.accessControlManagerAddress = event.params.newAccessControlManager;
  market.save();
}

export function handleReservesAdded(event: ReservesAdded): void {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  market.reservesMantissa = event.params.newTotalReserves;
  market.save();
}

export function handleReservesReduced(event: ReservesReduced): void {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  market.reservesMantissa = event.params.newTotalReserves;
  market.save();
}
