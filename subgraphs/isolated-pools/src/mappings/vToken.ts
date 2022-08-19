import { Mint } from '../../generated/PoolRegistry/VToken';
import { createMintTransaction } from '../operations/create';
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

export const handleRedeem = (): void => {}; // eslint-disable-line

export const handleBorrow = (): void => {}; // eslint-disable-line

export const handleRepayBorrow = (): void => {}; // eslint-disable-line

export const handleLiquidateBorrow = (): void => {}; // eslint-disable-line

export const handleAccrueInterest = (): void => {}; // eslint-disable-line

export const handleNewReserveFactor = (): void => {}; // eslint-disable-line

export const handleTransfer = (): void => {}; // eslint-disable-line

export const handleNewMarketInterestRateModel = (): void => {}; // eslint-disable-line
