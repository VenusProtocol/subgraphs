import {
  AccrueInterest,
  Borrow,
  LiquidateBorrow,
  Mint,
  NewMarketInterestRateModel,
  NewReserveFactor,
  Redeem,
  RepayBorrow,
  Transfer,
} from '../../generated/PoolRegistry/VToken';
import {
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
export const handleMint = (event: Mint): void => {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  createMintTransaction(event, market.underlyingDecimals);
};

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
export const handleRedeem = (event: Redeem): void => {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  createRedeemTransaction(event, market.underlyingDecimals);
};

/* Borrow assets from the protocol. All values either BNB or BEP20
 *
 * event.params.totalBorrows = of the whole market (not used right now)
 * event.params.accountBorrows = total of the account
 * event.params.borrowAmount = that was added in this event
 * event.params.borrower = the account
 * Notes
 *    No need to updateMarket(), handleAccrueInterest() ALWAYS runs before this
 */
export const handleBorrow = (event: Borrow): void => {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);

  updateAccountVTokenBorrow(
    vTokenAddress,
    market.symbol,
    event.params.borrower,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
    event.params.borrowAmount,
    event.params.accountBorrows,
    market.borrowIndex,
    market.underlyingDecimals,
  );

  createBorrowTransaction(event, market.underlyingDecimals);
};

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
export const handleRepayBorrow = (event: RepayBorrow): void => {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);

  updateAccountVTokenRepayBorrow(
    vTokenAddress,
    market.symbol,
    event.params.borrower,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
    event.params.repayAmount,
    event.params.accountBorrows,
    market.borrowIndex,
    market.underlyingDecimals,
  );

  createRepayBorrowTransaction(event, market.underlyingDecimals);
};

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
export const handleLiquidateBorrow = (event: LiquidateBorrow): void => {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  const liquidator = getOrCreateAccount(event.params.liquidator);
  liquidator.countLiquidator = liquidator.countLiquidator + 1;
  liquidator.save();

  const borrower = getOrCreateAccount(event.params.borrower);
  borrower.countLiquidated = borrower.countLiquidated + 1;
  borrower.save();

  createLiquidateBorrowTransaction(event, market.underlyingDecimals);
};

export const handleAccrueInterest = (event: AccrueInterest): void => {
  updateMarket(event.address, event.block.number.toI32(), event.block.timestamp.toI32());
};

export const handleNewReserveFactor = (event: NewReserveFactor): void => {}; // eslint-disable-line

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
export const handleTransfer = (event: Transfer): void => {
  const marketAddress = event.address;
  const accountFromAddress = event.params.from;
  const accountToAddress = event.params.to;

  let market = getOrCreateMarket(marketAddress);
  // We only updateMarket() if accrual block number is not up to date. This will only happen
  // with normal transfers, since mint, redeem, and seize transfers will already run updateMarket()
  if (market.accrualBlockNumber != event.block.number.toI32()) {
    market = updateMarket(event.address, event.block.number.toI32(), event.block.timestamp.toI32());
  }

  // Checking if the tx is FROM the vToken contract (i.e. this will not run when minting)
  // If so, it is a mint, and we don't need to run these calculations
  if (accountFromAddress.toHex() != marketAddress.toHex()) {
    getOrCreateAccount(accountFromAddress);

    updateAccountVTokenTransferFrom(
      marketAddress,
      market.symbol,
      accountFromAddress,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex,
      event.params.amount,
      market.exchangeRate,
      market.underlyingDecimals,
    );
  }

  // Checking if the tx is TO the vToken contract (i.e. this will not run when redeeming)
  // If so, we ignore it. this leaves an edge case, where someone who accidentally sends
  // vTokens to a vToken contract, where it will not get recorded. Right now it would
  // be messy to include, so we are leaving it out for now TODO fix this in future
  if (accountToAddress.toHex() != marketAddress.toHex()) {
    getOrCreateAccount(accountToAddress);

    updateAccountVTokenTransferTo(
      marketAddress,
      market.symbol,
      accountToAddress,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex,
      event.params.amount,
      market.exchangeRate,
      market.underlyingDecimals,
    );
  }

  createTransferTransaction(event);
};

export const handleNewMarketInterestRateModel = (event: NewMarketInterestRateModel): void => {
  const marketAddress = event.address;
  const market = getOrCreateMarket(marketAddress);
  market.interestRateModelAddress = event.params.newInterestRateModel;
  market.save();
};
