import { Mint, Redeem } from '../../generated/PoolRegistry/VToken';
import { createMintTransaction, createRedeemTransaction } from '../operations/create';
import { getOrCreateMarket } from '../operations/getOrCreate';

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

export const handleBorrow = (): void => {}; // eslint-disable-line

export const handleRepayBorrow = (): void => {}; // eslint-disable-line

export const handleLiquidateBorrow = (): void => {}; // eslint-disable-line

export const handleAccrueInterest = (): void => {}; // eslint-disable-line

export const handleNewReserveFactor = (): void => {}; // eslint-disable-line

export const handleTransfer = (): void => {}; // eslint-disable-line

export const handleNewMarketInterestRateModel = (): void => {}; // eslint-disable-line
