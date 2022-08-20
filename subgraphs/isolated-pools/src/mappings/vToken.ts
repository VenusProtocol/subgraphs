import { Borrow, Mint, Redeem } from '../../generated/PoolRegistry/VToken';
import {
  createBorrowTransaction,
  createMintTransaction,
  createRedeemTransaction,
} from '../operations/create';
import { getOrCreateMarket } from '../operations/getOrCreate';
import { updateAccountVTokenBorrow } from '../operations/update';

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

export const handleRepayBorrow = (): void => {}; // eslint-disable-line

export const handleLiquidateBorrow = (): void => {}; // eslint-disable-line

export const handleAccrueInterest = (): void => {}; // eslint-disable-line

export const handleNewReserveFactor = (): void => {}; // eslint-disable-line

export const handleTransfer = (): void => {}; // eslint-disable-line

export const handleNewMarketInterestRateModel = (): void => {}; // eslint-disable-line
