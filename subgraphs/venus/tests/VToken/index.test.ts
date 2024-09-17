import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';
import {
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { oneBigInt, zeroBigInt32 } from '../../src/constants';
import { comptrollerAddress } from '../../src/constants/addresses';
import { handleMarketListed } from '../../src/mappings/comptroller';
import {
  handleAccrueInterest,
  handleBorrow,
  handleLiquidateBorrow,
  handleMint,
  handleMintBehalf,
  handleMintBehalfV1,
  handleMintV1,
  handleNewMarketInterestRateModel,
  handleNewReserveFactor,
  handleRedeem,
  handleRedeemV1,
  handleRepayBorrow,
  handleReservesAdded,
  handleReservesReduced,
  handleTransfer,
} from '../../src/mappings/vToken';
import { getMarket } from '../../src/operations/get';
import { getAccountVTokenId } from '../../src/utilities/ids';
import {
  createAccrueInterestEvent,
  createBorrowEvent,
  createLiquidateBorrowEvent,
  createMarketListedEvent,
  createMintBehalfEvent,
  createMintBehalfEventV1,
  createMintEvent,
  createMintEventV1,
  createNewMarketInterestRateModelEvent,
  createNewReserveFactorEvent,
  createRedeemEvent,
  createRedeemEventV1,
  createRepayBorrowEvent,
  createReservesAddedEvent,
  createReservesReducedEvent,
  createTransferEvent,
} from './events';
import { createAccountVTokenBalanceOfMock, createBorrowBalanceCurrentMock } from './mocks';
import { createPriceOracleMock, createVBep20AndUnderlyingMock } from './mocks';

const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const user1Address = Address.fromString('0x0000000000000000000000000000000000000101');
const user2Address = Address.fromString('0x0000000000000000000000000000000000000202');
const user3Address = Address.fromString('0x0000000000000000000000000000000000000303');
const user4Address = Address.fromString('0x0000000000000000000000000000000000000404');
const aaaTokenAddress = Address.fromString('0x0000000000000000000000000000000000000aaa');

const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');

const underlyingPrice = BigInt.fromString('15000000000000000');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createVBep20AndUnderlyingMock(
    aaaTokenAddress,
    tokenAddress,
    comptrollerAddress,
    'AAA Coin',
    'AAA',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
    underlyingPrice,
  );

  createPriceOracleMock([
    [ethereum.Value.fromAddress(aaaTokenAddress), ethereum.Value.fromI32(99)],
  ]);

  createAccountVTokenBalanceOfMock(aaaTokenAddress, user1Address, zeroBigInt32);
  createAccountVTokenBalanceOfMock(aaaTokenAddress, user2Address, zeroBigInt32);
});

beforeEach(() => {
  // Add Market
  const marketAddedEvent = createMarketListedEvent(aaaTokenAddress);

  handleMarketListed(marketAddedEvent);
});

afterEach(() => {
  cleanup();
});

describe('VToken', () => {
  test('registers mint event', () => {
    const minter = user1Address;
    const actualMintAmount = BigInt.fromString('124620530798726345');
    const mintTokens = BigInt.fromString('37035970026454');
    createAccountVTokenBalanceOfMock(aaaTokenAddress, user1Address, mintTokens);
    const accountBalance = mintTokens;
    const mintEvent = createMintEvent(
      aaaTokenAddress,
      minter,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );
    const market = getMarket(aaaTokenAddress)!;
    assert.assertNotNull(market);

    handleMint(mintEvent);

    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, minter).toHexString();

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'vTokenBalanceMantissa',
      mintTokens.toString(),
    );
  });

  test('registers redeem event', () => {
    const redeemer = user2Address;
    const actualRedeemAmount = BigInt.fromString('124620530798726345');
    const redeemTokens = BigInt.fromString('37035970026454');
    const accountBalance = redeemTokens;

    const mintEvent = createMintEvent(
      aaaTokenAddress,
      redeemer,
      actualRedeemAmount,
      redeemTokens,
      accountBalance,
    );
    handleMint(mintEvent);

    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, redeemer).toHexString();

    const redeemEvent = createRedeemEvent(
      aaaTokenAddress,
      redeemer,
      actualRedeemAmount,
      redeemTokens,
      accountBalance,
    );
    const market = getMarket(aaaTokenAddress)!;
    assert.assertNotNull(market);

    handleRedeem(redeemEvent);

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'vTokenBalanceMantissa',
      accountBalance.toString(),
    );

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'totalUnderlyingRedeemedMantissa',
      redeemEvent.params.redeemAmount.toString(),
    );
  });

  test('registers borrow event', () => {
    /** Constants */
    const borrower = user1Address;
    const borrowAmount = BigInt.fromString('1246205398726345');
    const accountBorrows = BigInt.fromString('35970026454');
    const totalBorrows = BigInt.fromString('37035970026454');

    /** Setup test */
    const borrowEvent = createBorrowEvent(
      aaaTokenAddress,
      borrower,
      borrowAmount,
      accountBorrows,
      totalBorrows,
    );

    createMockedFunction(
      aaaTokenAddress,
      'getAccountSnapshot',
      'getAccountSnapshot(address):(uint256,uint256,uint256,uint256)',
    )
      .withArgs([ethereum.Value.fromAddress(borrower)])
      .returns([
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(oneBigInt),
      ]);

    /** Fire Event */
    handleBorrow(borrowEvent);

    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }
  });

  test('registers repay borrow event', () => {
    /** Constants */
    const borrower = user1Address;
    const payer = user1Address;
    const repayAmount = BigInt.fromString('1246205398726345');
    const accountBorrows = BigInt.fromString('35970026454');
    const totalBorrows = BigInt.fromString('37035970026454');
    const balanceOf = BigInt.fromString('9937035970026454');

    /** Setup test */
    const repayBorrowEvent = createRepayBorrowEvent(
      aaaTokenAddress,
      payer,
      borrower,
      repayAmount,
      accountBorrows,
      totalBorrows,
    );

    createMockedFunction(
      aaaTokenAddress,
      'getAccountSnapshot',
      'getAccountSnapshot(address):(uint256,uint256,uint256,uint256)',
    )
      .withArgs([ethereum.Value.fromAddress(borrower)])
      .returns([
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(balanceOf),
        ethereum.Value.fromSignedBigInt(accountBorrows),
        ethereum.Value.fromSignedBigInt(oneBigInt),
      ]);

    /** Fire Event */
    handleRepayBorrow(repayBorrowEvent);

    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, borrower).toHexString();
    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'storedBorrowBalanceMantissa',
      accountBorrows.toString(),
    );
  });

  test('registers liquidate borrow event', () => {
    /** Constants */
    const borrower = user1Address;
    const liquidator = user1Address;
    const repayAmount = BigInt.fromString('1246205398726345');
    const seizeTokens = BigInt.fromString('37035970026454');
    const vTokenCollateral = aaaTokenAddress;

    /** Setup test */
    createBorrowBalanceCurrentMock(vTokenCollateral, borrower, repayAmount);
    const liquidateBorrowEvent = createLiquidateBorrowEvent(
      aaaTokenAddress,
      liquidator,
      borrower,
      repayAmount,
      vTokenCollateral,
      seizeTokens,
    );

    /** Fire Event */
    handleLiquidateBorrow(liquidateBorrowEvent);

    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }
  });

  test('registers accrue interest event', () => {
    /** Constants */
    const cashPrior = BigInt.fromString('5555566666000012345');
    const interestAccumulated = BigInt.fromI32(26454);
    const newBorrowIndex = BigInt.fromString('400000000000000000000');
    const newTotalBorrows = BigInt.fromString('4321234234636158123');

    /** Setup test */
    const accrueInterestEvent = createAccrueInterestEvent(
      aaaTokenAddress,
      cashPrior,
      interestAccumulated,
      newBorrowIndex,
      newTotalBorrows,
    );

    /** Fire Event */
    handleAccrueInterest(accrueInterestEvent);

    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', aaaTokenAddress.toHexString(), key, value);
    };

    assertMarketDocument('accrualBlockNumber', '999');
    assertMarketDocument('blockTimestamp', accrueInterestEvent.block.timestamp.toString());
    assertMarketDocument('exchangeRateMantissa', '365045823500000000000000');
    assertMarketDocument('borrowIndex', newBorrowIndex.toString());
    assertMarketDocument('reservesMantissa', '5128924555022289393');
    assertMarketDocument('totalBorrowsMantissa', newTotalBorrows.toString());
    assertMarketDocument('cashMantissa', '1418171344423412457'); // get cash mock return
    assertMarketDocument('borrowRateMantissa', '12678493');
    assertMarketDocument('supplyRateMantissa', '12678493');
  });

  test('registers new reserve factor', () => {
    const oldReserveFactor = BigInt.fromI64(12462053079875);
    const newReserveFactor = BigInt.fromI64(37035970026454);
    const reserveFactorEvent = createNewReserveFactorEvent(
      aaaTokenAddress,
      oldReserveFactor,
      newReserveFactor,
    );

    handleNewReserveFactor(reserveFactorEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'id', aaaTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHex(),
      'reserveFactor',
      newReserveFactor.toString(),
    );
  });

  test('registers transfer from event', () => {
    /** Constants */
    const from = user1Address; // 101
    const to = user2Address;

    const actualMintAmount = BigInt.fromString('124620530798726345');
    const mintTokens = BigInt.fromString('37035970026454');

    const accountBalance = mintTokens;

    const amount = BigInt.fromString('146205398723');
    const balanceOf = BigInt.fromString('262059874253345');

    const mintEvent = createMintEvent(
      aaaTokenAddress,
      from,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );

    handleMint(mintEvent);

    /** Setup test */
    const transferEvent = createTransferEvent(aaaTokenAddress, from, to, amount);
    createMockedFunction(
      aaaTokenAddress,
      'getAccountSnapshot',
      'getAccountSnapshot(address):(uint256,uint256,uint256,uint256)',
    )
      .withArgs([ethereum.Value.fromAddress(from)])
      .returns([
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(balanceOf),
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(oneBigInt),
      ]);

    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, from).toHexString();
    /** AccountVToken */
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'vTokenBalanceMantissa',
      mintTokens.toString(),
    );

    /** Fire Event */
    handleTransfer(transferEvent);

    /** AccountVToken */
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'vTokenBalanceMantissa',
      mintTokens.minus(amount).toString(),
    );
  });

  test('registers transfer to event', () => {
    /** Constants */
    const amount = BigInt.fromString('5246205398726345');
    const from = user1Address;
    const to = user2Address;
    const balanceOf = BigInt.fromString('262059874253345');

    /** Setup test */
    const transferEvent = createTransferEvent(aaaTokenAddress, from, to, amount);
    createAccountVTokenBalanceOfMock(aaaTokenAddress, to, amount.plus(balanceOf));
    createMockedFunction(
      aaaTokenAddress,
      'getAccountSnapshot',
      'getAccountSnapshot(address):(uint256,uint256,uint256,uint256)',
    )
      .withArgs([ethereum.Value.fromAddress(to)])
      .returns([
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(balanceOf),
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(oneBigInt),
      ]);

    /** Fire Event */
    handleTransfer(transferEvent);

    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, to).toHexString();

    /** AccountVToken */
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'vTokenBalanceMantissa',
      amount.plus(balanceOf).toString(),
    );
  });

  test('registers new interest rate model', () => {
    const oldInterestRateModel = Address.fromString('0x0000000000000000000000000000000000000e0e');
    const newInterestRateModel = Address.fromString('0x0000000000000000000000000000000000000f0f');
    const newMarketInterestRateModelEvent = createNewMarketInterestRateModelEvent(
      aaaTokenAddress,
      oldInterestRateModel,
      newInterestRateModel,
    );

    handleNewMarketInterestRateModel(newMarketInterestRateModelEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'id', aaaTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHex(),
      'interestRateModelAddress',
      newInterestRateModel.toHexString(),
    );
  });

  test('registers increase and decrease in the market supplier count', () => {
    const market = getMarket(aaaTokenAddress)!;
    const marketId = market.id.toHexString();
    assert.assertNotNull(market);
    if (!market) {
      return;
    }
    assert.fieldEquals('Market', marketId, 'supplierCount', '0');

    const actualMintAmount = BigInt.fromI64(12);
    const halfActualMintAmount = actualMintAmount.div(BigInt.fromI64(2));
    const mintTokens = BigInt.fromI64(10);
    const accountBalance = mintTokens;
    const halfMintTokens = mintTokens.div(BigInt.fromI64(2));

    const supplier01 = user1Address;
    const mintEvent = createMintEvent(
      aaaTokenAddress,
      supplier01,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );

    handleMint(mintEvent);

    assert.fieldEquals('Market', marketId, 'supplierCount', '1');

    const supplier02 = user2Address;
    const mintEventV1 = createMintEventV1(
      aaaTokenAddress,
      supplier02,
      actualMintAmount,
      mintTokens,
    );
    createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier02, mintTokens);

    handleMintV1(mintEventV1);
    assert.fieldEquals('Market', marketId, 'supplierCount', '2');

    const supplier03 = user3Address;
    const mintBehalfEvent = createMintBehalfEvent(
      aaaTokenAddress,
      supplier01,
      supplier03,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );
    createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier03, mintTokens);

    handleMintBehalf(mintBehalfEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '3');

    const supplier04 = user4Address;
    const mintBehalfEventV1 = createMintBehalfEventV1(
      aaaTokenAddress,
      supplier01,
      supplier04,
      actualMintAmount,
      mintTokens,
    );
    createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier04, mintTokens);

    handleMintBehalfV1(mintBehalfEventV1);
    assert.fieldEquals('Market', marketId, 'supplierCount', '4');

    let redeemEvent = createRedeemEvent(
      aaaTokenAddress,
      supplier02,
      actualMintAmount,
      mintTokens,
      zeroBigInt32,
    );
    createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier02, zeroBigInt32);

    handleRedeem(redeemEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '3');

    const redeemEventV1 = createRedeemEventV1(
      aaaTokenAddress,
      supplier01,
      halfActualMintAmount,
      halfMintTokens,
    );
    createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier01, halfMintTokens);

    handleRedeemV1(redeemEventV1);
    assert.fieldEquals('Market', marketId, 'supplierCount', '3');

    redeemEvent = createRedeemEvent(
      aaaTokenAddress,
      supplier01,
      halfActualMintAmount,
      halfMintTokens,
      zeroBigInt32,
    );
    createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier01, zeroBigInt32);

    handleRedeem(redeemEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '2');
  });

  test('registers increase and decrease in the market borrower count', () => {
    const market = getMarket(aaaTokenAddress)!;
    const marketId = market.id.toHexString();
    assert.assertNotNull(market);
    if (!market) {
      return;
    }
    assert.fieldEquals('Market', marketId, 'borrowerCount', '0');

    const borrowAmount = BigInt.fromI64(22);
    const partialBorrowAmountWei = borrowAmount.div(BigInt.fromI64(2));

    const borrower01 = user1Address;
    let borrowEvent = createBorrowEvent(
      aaaTokenAddress,
      borrower01,
      borrowAmount,
      borrowAmount,
      borrowAmount,
    );

    handleBorrow(borrowEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'borrowerCount', '1');
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'borrowerCountAdjusted', '1');

    const borrower02 = user2Address;
    borrowEvent = createBorrowEvent(
      aaaTokenAddress,
      borrower02,
      borrowAmount,
      borrowAmount,
      borrowAmount,
    );

    handleBorrow(borrowEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'borrowerCount', '2');
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'borrowerCountAdjusted', '2');

    let repayEvent = createRepayBorrowEvent(
      aaaTokenAddress,
      borrower02,
      borrower02,
      borrowAmount,
      zeroBigInt32,
      zeroBigInt32,
    );

    handleRepayBorrow(repayEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'borrowerCount', '1');
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'borrowerCountAdjusted', '1');

    repayEvent = createRepayBorrowEvent(
      aaaTokenAddress,
      borrower01,
      borrower01,
      partialBorrowAmountWei,
      partialBorrowAmountWei,
      partialBorrowAmountWei,
    );

    handleRepayBorrow(repayEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'borrowerCount', '1');
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'borrowerCountAdjusted', '1');

    repayEvent = createRepayBorrowEvent(
      aaaTokenAddress,
      borrower01,
      borrower01,
      oneBigInt,
      partialBorrowAmountWei.minus(oneBigInt),
      partialBorrowAmountWei.minus(oneBigInt),
    );

    handleRepayBorrow(repayEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'borrowerCount', '1');
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'borrowerCountAdjusted', '0');
  });

  test('registers reserves added event', () => {
    const benefactor = Address.fromString('0x0000000000000000000000000000000000000111');
    const addAmount = BigInt.fromString('123456789000000');
    const newTotalReserves = BigInt.fromString('123456789000000');
    const newReservesAddedEvent = createReservesAddedEvent(
      aaaTokenAddress,
      benefactor,
      addAmount,
      newTotalReserves,
    );

    handleReservesAdded(newReservesAddedEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'id', aaaTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHex(),
      'reservesMantissa',
      newTotalReserves.toString(),
    );
  });

  test('registers reserves reduced event', () => {
    const admin = Address.fromString('0x0000000000000000000000000000000000000111');
    const reduceAmount = BigInt.fromString('123456789000000');
    const newTotalReserves = BigInt.fromString('0');
    const newReservesReducedEvent = createReservesReducedEvent(
      aaaTokenAddress,
      admin,
      reduceAmount,
      newTotalReserves,
    );

    handleReservesReduced(newReservesReducedEvent);
    assert.fieldEquals('Market', aaaTokenAddress.toHex(), 'id', aaaTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHex(),
      'reservesMantissa',
      newTotalReserves.toString(),
    );
  });
});
