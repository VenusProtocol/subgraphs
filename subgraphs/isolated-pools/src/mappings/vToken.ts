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
  createMintTransaction,
  createRedeemTransaction,
  createRepayBorrowTransaction,
} from '../operations/create';
import { getOrCreateMarket } from '../operations/getOrCreate';
import { updateAccountVTokenBorrow, updateAccountVTokenRepayBorrow } from '../operations/update';

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

export const handleLiquidateBorrow = (event: LiquidateBorrow): void => {}; // eslint-disable-line

export const handleAccrueInterest = (event: AccrueInterest): void => {}; // eslint-disable-line

export const handleNewReserveFactor = (event: NewReserveFactor): void => {}; // eslint-disable-line

export const handleTransfer = (event: Transfer): void => {}; // eslint-disable-line

export const handleNewMarketInterestRateModel = (event: NewMarketInterestRateModel): void => {}; // eslint-disable-line
