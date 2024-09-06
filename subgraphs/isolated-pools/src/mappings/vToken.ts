import { Address } from '@graphprotocol/graph-ts';

import {
  AccrueInterest,
  BadDebtIncreased,
  Borrow,
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
import { getMarket } from '../operations/get';
import {
  getOrCreateAccount,
  getOrCreateAccountVToken,
  getOrCreateMarket,
} from '../operations/getOrCreate';
import { recordLiquidatorAsSupplier } from '../operations/recordLiquidatorAsSupplier';
import {
  updateAccountVTokenAccrualBlockNumber,
  updateAccountVTokenBorrow,
  updateAccountVTokenRepayBorrow,
  updateAccountVTokenSupply,
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
  const market = getOrCreateMarket(vTokenAddress, null);
  createMintTransaction(event);

  // we read the current total amount of supplied tokens by this account in the market
  const suppliedTotal = event.params.accountBalance;
  updateAccountVTokenSupply(
    event.params.minter,
    Address.fromBytes(market.pool),
    vTokenAddress,
    event.block.number,
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
 */
export function handleRedeem(event: Redeem): void {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  createRedeemTransaction(event);

  // we read the account's balance and...
  const currentBalance = event.params.accountBalance;
  updateAccountVTokenSupply(
    event.params.redeemer,
    Address.fromBytes(market.pool),
    vTokenAddress,
    event.block.number,
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
    event.params.borrower,
    Address.fromBytes(market.pool),
    vTokenAddress,
    event.block.number,
    event.params.accountBorrows,
    market.borrowIndexMantissa,
  );

  createBorrowTransaction(event);

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
    event.params.borrower,
    Address.fromBytes(market.pool),
    vTokenAddress,
    event.block.number,
    event.params.accountBorrows,
    market.borrowIndexMantissa,
  );

  createRepayBorrowTransaction(event);

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
  const liquidator = getOrCreateAccount(event.params.liquidator);
  liquidator.countLiquidator = liquidator.countLiquidator + 1;
  liquidator.save();

  const borrower = getOrCreateAccount(event.params.borrower);
  borrower.countLiquidated = borrower.countLiquidated + 1;
  borrower.save();

  createLiquidateBorrowTransaction(event);

  const borrowMarket = getMarket(event.address)!;
  const collateralMarket = getMarket(event.params.vTokenCollateral)!;

  const borrowedVTokenContract = VTokenContract.bind(event.address);
  const collateralContract = VTokenContract.bind(event.params.vTokenCollateral);
  const borrowerBorrowAccountVTokenResult = getOrCreateAccountVToken(
    event.params.borrower,
    Address.fromBytes(borrowMarket.pool),
    event.address,
  );
  const borrowerBorrowAccountVToken = borrowerBorrowAccountVTokenResult.entity;

  // Creation updates balance
  borrowerBorrowAccountVToken.accountBorrowIndexMantissa = borrowedVTokenContract.borrowIndex();
  borrowerBorrowAccountVToken.accountBorrowBalanceMantissa =
    borrowedVTokenContract.borrowBalanceStored(event.params.borrower);
  borrowerBorrowAccountVToken.save();

  const borrowerSupplyAccountVTokenResult = getOrCreateAccountVToken(
    event.params.borrower,
    Address.fromBytes(borrowMarket.pool),
    event.params.vTokenCollateral,
  );
  const borrowerSupplyAccountVToken = borrowerSupplyAccountVTokenResult.entity;

  borrowerSupplyAccountVToken.accountVTokenSupplyBalanceMantissa =
    borrowerSupplyAccountVToken.accountVTokenSupplyBalanceMantissa.minus(event.params.seizeTokens);
  borrowerSupplyAccountVToken.save();

  const collateralBalance = collateralContract.balanceOf(event.params.borrower);
  // Check if borrower is still supplying liquidated asset
  if (collateralBalance.equals(zeroBigInt32)) {
    collateralMarket.supplierCount = collateralMarket.supplierCount.minus(oneBigInt);
    collateralMarket.save();
  }

  // Check if borrower is still borrowing
  if (borrowerBorrowAccountVToken.accountBorrowBalanceMantissa.equals(zeroBigInt32)) {
    borrowMarket.borrowerCount = borrowMarket.borrowerCount.minus(oneBigInt);
    borrowMarket.save();
  }
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

export function handleProtocolSeize(event: ProtocolSeize): void {
  recordLiquidatorAsSupplier(event);
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
  const market = updateMarket(
    event.address,
    event.block.number.toI32(),
    event.block.timestamp.toI32(),
  );
  const accountFromAddress = event.params.from;
  const accountToAddress = event.params.to;
  // Checking if the event is FROM the vToken contract or null (i.e. this will not run when minting)
  // Checking if the event is TO the vToken contract (i.e. this will not run when redeeming)
  // @TODO Edge case where someone who accidentally sends vTokens to a vToken contract, where it will not get recorded.
  if (
    accountFromAddress.notEqual(event.address) &&
    accountFromAddress.notEqual(nullAddress) &&
    accountToAddress.notEqual(event.address)
  ) {
    getOrCreateAccount(accountFromAddress);
    const resultFrom = getOrCreateAccountVToken(
      accountFromAddress,
      Address.fromBytes(market.pool),
      event.address,
    );
    const accountFromVToken = resultFrom.entity;

    updateAccountVTokenAccrualBlockNumber(
      accountFromAddress,
      Address.fromBytes(market.pool),
      event.address,
      event.block.number,
    );

    // Creation updates balance
    if (!resultFrom.created) {
      accountFromVToken.accountVTokenSupplyBalanceMantissa =
        accountFromVToken.accountVTokenSupplyBalanceMantissa.minus(event.params.amount);
      accountFromVToken.save();
    }
    getOrCreateAccount(accountToAddress);
    const resultTo = getOrCreateAccountVToken(
      accountToAddress,
      Address.fromBytes(market.pool),
      event.address,
    );
    const accountToVToken = resultTo.entity;

    updateAccountVTokenAccrualBlockNumber(
      accountToAddress,
      Address.fromBytes(market.pool),
      event.address,
      event.block.number,
    );

    // Creation updates balance
    if (!resultTo.created) {
      accountToVToken.accountVTokenSupplyBalanceMantissa =
        accountToVToken.accountVTokenSupplyBalanceMantissa.plus(event.params.amount);
      accountToVToken.save();
    }
  }

  createTransferTransaction(event);
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

export function handleSpreadReservesReduced(event: SpreadReservesReduced): void {
  const vTokenAddress = event.address;
  const market = getOrCreateMarket(vTokenAddress);
  market.reservesMantissa = event.params.newTotalReserves;
  market.save();
}
