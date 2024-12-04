/* eslint-disable prefer-const */
// to satisfy AS compiler
import {
  AccrueInterest,
  Borrow,
  LiquidateBorrow,
  MintBehalf as MintBehalfV1,
  Mint as MintV1,
  NewMarketInterestRateModel,
  NewReserveFactor,
  Redeem as RedeemV1,
  RepayBorrow,
  ReservesAdded,
  ReservesReduced,
  Transfer,
  VToken,
} from '../../generated/templates/VToken/VToken';
import { Mint, MintBehalf, Redeem } from '../../generated/templates/VTokenUpdatedEvents/VToken';
import { zeroBigInt32 } from '../constants';
import { nullAddress } from '../constants/addresses';
import {
  createBorrowEvent,
  createLiquidationEvent,
  createMintBehalfEvent,
  createMintEvent,
  createRedeemEvent,
  createRepayEvent,
  createTransferEvent,
} from '../operations/create';
import {
  getOrCreateAccount,
  getOrCreateAccountVToken,
  getOrCreateMarket,
} from '../operations/getOrCreate';
import { updateAccountVTokenSupply, updateAccountVTokenBorrow } from '../operations/update';
import { updateMarketCashMantissa } from '../operations/updateMarketCashMantissa';
import { updateMarketRates } from '../operations/updateMarketRates';
import { getUnderlyingPrice } from '../utilities';

/* Account supplies assets into market and receives vTokens in exchange
 *
 * event.params.mintAmount is the underlying asset
 * event.params.mintTokens is the amount of vTokens minted
 * event.params.minter is the account
 * event.params.totalSupply is how much the account is currently supplying (not the market's total)
 *
 * Notes
 *    Transfer event will always get emitted with this
 *    Mints originate from the vToken address, not 0x000000, which is typical of ERC-20s
 */
export function handleMint(event: Mint): void {
  const marketAddress = event.address;

  updateAccountVTokenSupply(
    event.params.minter,
    marketAddress,
    event.block.number,
    event.params.totalSupply,
  );

  const market = getOrCreateMarket(marketAddress, event);

  // and finally we update the market total supply
  market.totalSupplyVTokenMantissa = market.totalSupplyVTokenMantissa.plus(event.params.mintTokens);
  market.save();

  createMintEvent<Mint>(event);
}

export function handleMintBehalf(event: MintBehalf): void {
  const marketAddress = event.address;

  updateAccountVTokenSupply(
    event.params.receiver,
    marketAddress,
    event.block.number,
    event.params.totalSupply,
  );

  const market = getOrCreateMarket(marketAddress, event);

  // and finally we update the market total supply
  market.totalSupplyVTokenMantissa = market.totalSupplyVTokenMantissa.plus(event.params.mintTokens);
  market.save();

  createMintBehalfEvent<MintBehalf>(event);
}

/*  Account supplies vTokens into market and receives underlying asset in exchange
 *
 *  event.params.redeemAmount is the underlying asset
 *  event.params.redeemTokens is the vTokens
 *  event.params.redeemer is the account
 *  event.params.totalSupply is how much the account is currently supplying (not the market's total)
 *
 *  Notes
 *    Transfer event will always get emitted with this
 */
export function handleRedeem(event: Redeem): void {
  const marketAddress = event.address;

  updateAccountVTokenSupply(
    event.params.redeemer,
    marketAddress,
    event.block.number,
    event.params.totalSupply,
  );

  const accountVToken = getOrCreateAccountVToken(event.params.redeemer, marketAddress);
  accountVToken.entity.totalUnderlyingRedeemedMantissa =
    accountVToken.entity.totalUnderlyingRedeemedMantissa.plus(event.params.redeemAmount);
  accountVToken.entity.save();

  const market = getOrCreateMarket(marketAddress, event);

  // and finally we update the market total supply
  market.totalSupplyVTokenMantissa = market.totalSupplyVTokenMantissa.minus(
    event.params.redeemTokens,
  );
  market.save();

  createRedeemEvent<Redeem>(event);
}

/* Borrow assets from the protocol. All values either BNB or BEP20
 *
 * event.params.totalBorrows = of the whole market
 * event.params.accountBorrows = total of the account
 * event.params.borrowAmount = that was added in this event
 * event.params.borrower = the account
 * Notes
 */
export function handleBorrow(event: Borrow): void {
  const marketAddress = event.address;
  const market = getOrCreateMarket(marketAddress, event);
  market.totalBorrowsMantissa = event.params.totalBorrows;

  market.save();

  const account = getOrCreateAccount(event.params.borrower);
  account.hasBorrowed = true;
  account.save();

  updateAccountVTokenBorrow(
    event.params.borrower,
    marketAddress,
    event.block.number,
    event.params.accountBorrows,
  );

  createBorrowEvent<Borrow>(event);
}

/* Repay some amount borrowed. Anyone can repay anyone's balance
 *
 * event.params.totalBorrows = of the whole market
 * event.params.accountBorrows = total of the account
 * event.params.repayAmount = that was added in this event
 * event.params.borrower = the borrower
 * event.params.payer = the payer
 *
 * Notes
 *    Once a account totally repays a borrow, it still has its account interest index set to the
 *    markets value. We keep this, even though you might think it would reset to 0 upon full
 *    repay.
 */
export function handleRepayBorrow(event: RepayBorrow): void {
  const marketAddress = event.address;
  const market = getOrCreateMarket(marketAddress, event);

  market.totalBorrowsMantissa = event.params.totalBorrows;

  market.save();

  const accountVToken = updateAccountVTokenBorrow(
    event.params.borrower,
    marketAddress,
    event.block.number,
    event.params.accountBorrows,
  );

  accountVToken.totalUnderlyingRepaidMantissa = accountVToken.totalUnderlyingRepaidMantissa.plus(
    event.params.repayAmount,
  );
  accountVToken.save();

  createRepayEvent<RepayBorrow>(event);
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
 *    When calling this const, event RepayBorrow, and event Transfer will be called every
 *    time. This means we can ignore repayAmount. Seize tokens only changes state
 *    of the vTokens, which is covered by transfer. Therefore we only
 *    add liquidation counts in this handler.
 */
export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  const liquidator = getOrCreateAccount(event.params.liquidator);
  liquidator.countLiquidator = liquidator.countLiquidator + 1;
  liquidator.save();

  const borrower = getOrCreateAccount(event.params.borrower);
  borrower.countLiquidated = borrower.countLiquidated + 1;
  borrower.save();

  // For a liquidation, the liquidator pays down the borrow of the underlying
  // asset. They seize one of potentially many types of vToken collateral of
  // the underwater borrower. So we must get that address from the event, and
  // the repay token is the event.address
  createLiquidationEvent<LiquidateBorrow>(event);
}

/* Transferring of vTokens
 *
 * event.params.from = sender of vTokens
 * event.params.to = receiver of vTokens
 * event.params.amount = amount sent
 *
 * Notes
 *    This handler on handles the transfer of vTokens between user accounts.
 *    Transfer events emitted by mint, redeem, and seize are handled by their respective handlers.
 */
export function handleTransfer(event: Transfer): void {
  let accountFromAddress = event.params.from;
  let accountToAddress = event.params.to;

  // Checking if the event is FROM the vToken contract or null (i.e. this will not run when minting)
  // Checking if the event is TO the vToken contract (i.e. this will not run when redeeming)
  // @TODO Edge case where someone who accidentally sends vTokens to a vToken contract, where it will not get recorded.
  if (
    accountFromAddress.notEqual(nullAddress) &&
    accountFromAddress.notEqual(event.address) &&
    accountToAddress.notEqual(event.address)
  ) {
    getOrCreateAccount(accountFromAddress);
    const accountVToken = getOrCreateAccountVToken(accountFromAddress, event.address);
    updateAccountVTokenSupply(
      accountFromAddress,
      event.address,
      event.block.number,
      accountVToken.entity.vTokenBalanceMantissa.minus(event.params.amount),
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
    const accountVToken = getOrCreateAccountVToken(accountToAddress, event.address);
    updateAccountVTokenSupply(
      accountToAddress,
      event.address,
      event.block.number,
      accountVToken.entity.vTokenBalanceMantissa.plus(event.params.amount),
    );
  }

  createTransferEvent<Transfer>(event);
}

export function handleAccrueInterest(event: AccrueInterest): void {
  // updates market.accrualBlockNumber and rates
  const marketAddress = event.address;
  const market = getOrCreateMarket(marketAddress, event);
  const vTokenContract = VToken.bind(marketAddress);

  market.accrualBlockNumber = event.block.number;
  market.borrowIndex = event.params.borrowIndex;
  market.totalBorrowsMantissa = event.params.totalBorrows;
  updateMarketCashMantissa(market, vTokenContract);
  market.lastUnderlyingPriceCents = getUnderlyingPrice(marketAddress, market.underlyingDecimals);
  market.lastUnderlyingPriceBlockNumber = event.block.number;

  updateMarketRates(market, vTokenContract);
  market.reservesMantissa = vTokenContract.totalReserves();
  market.save();
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  const market = getOrCreateMarket(event.address, event);
  market.reserveFactorMantissa = event.params.newReserveFactorMantissa;
  market.save();
}

export function handleNewMarketInterestRateModel(event: NewMarketInterestRateModel): void {
  const market = getOrCreateMarket(event.address, event);
  market.interestRateModelAddress = event.params.newInterestRateModel;
  market.save();
}

export function handleMintV1(event: MintV1): void {
  const marketAddress = event.address;
  const accountVToken = getOrCreateAccountVToken(event.params.minter, marketAddress);
  // Creation updates balance
  updateAccountVTokenSupply(
    event.params.minter,
    event.address,
    event.block.number,
    accountVToken.entity.vTokenBalanceMantissa.plus(event.params.mintTokens),
  );
  const market = getOrCreateMarket(event.address, event);

  // finally we update the market total supply
  market.totalSupplyVTokenMantissa = market.totalSupplyVTokenMantissa.plus(event.params.mintTokens);

  createMintEvent<MintV1>(event);

  market.save();
}

export function handleMintBehalfV1(event: MintBehalfV1): void {
  const marketAddress = event.address;

  const accountVToken = getOrCreateAccountVToken(event.params.receiver, marketAddress);
  // Creation updates balance
  updateAccountVTokenSupply(
    event.params.receiver,
    event.address,
    event.block.number,
    accountVToken.entity.vTokenBalanceMantissa.plus(event.params.mintTokens),
  );
  const market = getOrCreateMarket(event.address, event);

  // and then we update the market total supply
  market.totalSupplyVTokenMantissa = market.totalSupplyVTokenMantissa.plus(event.params.mintTokens);

  market.save();

  createMintBehalfEvent<MintBehalfV1>(event);
}

export function handleRedeemV1(event: RedeemV1): void {
  const marketAddress = event.address;
  const market = getOrCreateMarket(event.address, event);

  // finally we update the market total supply
  market.totalSupplyVTokenMantissa = market.totalSupplyVTokenMantissa.minus(
    event.params.redeemTokens,
  );
  market.save();

  createRedeemEvent<RedeemV1>(event);

  const result = getOrCreateAccountVToken(event.params.redeemer, marketAddress);
  const accountVToken = result.entity;

  updateAccountVTokenSupply(
    event.params.redeemer,
    event.address,
    event.block.number,
    accountVToken.vTokenBalanceMantissa.minus(event.params.redeemTokens),
  );
}

export function handleReservesAdded(event: ReservesAdded): void {
  const marketAddress = event.address;
  const market = getOrCreateMarket(event.address, event);
  const vTokenContract = VToken.bind(marketAddress);
  market.reservesMantissa = event.params.newTotalReserves;
  updateMarketRates(market, vTokenContract);

  market.save();
}

export function handleReservesReduced(event: ReservesReduced): void {
  const marketAddress = event.address;
  const market = getOrCreateMarket(event.address, event);
  const vTokenContract = VToken.bind(marketAddress);

  market.reservesMantissa = event.params.newTotalReserves;
  updateMarketRates(market, vTokenContract);

  market.save();
}
