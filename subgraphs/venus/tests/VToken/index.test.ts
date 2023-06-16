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
  handleNewMarketInterestRateModel,
  handleNewReserveFactor,
  handleRedeem,
  handleRepayBorrow,
  handleTransfer,
} from '../../src/mappings/vtoken';
import { getMarket } from '../../src/operations/get';
import { getAccountVTokenId } from '../../src/utilities/ids';
import {
  createAccrueInterestEvent,
  createBorrowEvent,
  createLiquidateBorrowEvent,
  createMarketListedEvent,
  createMintEvent,
  createNewMarketInterestRateModelEvent,
  createNewReserveFactorEvent,
  createRedeemEvent,
  createRepayBorrowEvent,
  createTransferEvent,
} from './events';
import { createAccountVTokenBalanceOfMock } from './mocks';
import { createMarketMock, createPriceOracleMock, createVBep20AndUnderlyingMock } from './mocks';

const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const user1Address = Address.fromString('0x0000000000000000000000000000000000000101');
const user2Address = Address.fromString('0x0000000000000000000000000000000000000202');
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

  createMarketMock(aaaTokenAddress);

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
    const accountBalance = mintTokens;
    const mintEvent = createMintEvent(
      aaaTokenAddress,
      minter,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );
    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }

    handleMint(mintEvent);
  });

  test('registers redeem event', () => {
    const redeemer = user2Address;
    const actualRedeemAmount = BigInt.fromString('124620530798726345');
    const redeemTokens = BigInt.fromString('37035970026454');
    const accountBalance = redeemTokens;
    const redeemEvent = createRedeemEvent(
      aaaTokenAddress,
      redeemer,
      actualRedeemAmount,
      redeemTokens,
      accountBalance,
    );
    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }

    handleRedeem(redeemEvent);
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

    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, borrower);
    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      borrowEvent.block.number.toString(),
    );

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountBorrowIndexMantissa',
      market.borrowIndexMantissa.toString(),
    );
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

    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, borrower);
    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      repayBorrowEvent.block.number.toString(),
    );

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountBorrowIndexMantissa',
      market.borrowIndexMantissa.toString(),
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

    test('registers accrue interest event', () => {
      /** Constants */
      const cashPrior = BigInt.fromString('1246205398726345');
      const interestAccumulated = BigInt.fromI32(26454);
      const borrowIndex = BigInt.fromI32(1);
      const totalBorrows = BigInt.fromString('62197468301');

      /** Setup test */
      const accrueInterestEvent = createAccrueInterestEvent(
        aaaTokenAddress,
        cashPrior,
        interestAccumulated,
        borrowIndex,
        totalBorrows,
      );

      /** Fire Event */
      handleAccrueInterest(accrueInterestEvent);

      const assertMarketDocument = (key: string, value: string): void => {
        assert.fieldEquals('Market', aaaTokenAddress.toHexString(), key, value);
      };

      assertMarketDocument('accrualBlockNumber', '999');
      assertMarketDocument('blockTimestamp', accrueInterestEvent.block.timestamp.toString());
      assertMarketDocument('exchangeRateMantissa', '365045823500000000000000');
      assertMarketDocument('borrowIndexMantissa', '300000000000000000000');
      assertMarketDocument('reservesMantissa', '5128924555022289393');
      assertMarketDocument('totalBorrowsMantissa', '2641234234636158123');
      assertMarketDocument('cash', '1.418171344423412457');
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
      const to = aaaTokenAddress;
      const amount = BigInt.fromString('146205398726345');
      const balanceOf = BigInt.fromString('262059874253345');

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

      /** Fire Event */
      handleTransfer(transferEvent);

      const accountVTokenId = getAccountVTokenId(aaaTokenAddress, from);

      /** AccountVToken */
      assert.fieldEquals(
        'AccountVToken',
        accountVTokenId,
        'accrualBlockNumber',
        transferEvent.block.number.toString(),
      );

      assert.fieldEquals('AccountVToken', accountVTokenId, 'accountBorrowIndexMantissa', '0');

      assert.fieldEquals(
        'AccountVToken',
        accountVTokenId,
        'totalUnderlyingRedeemedMantissa',
        '53371670178204461670107500000000000000',
      );
    });

    test('registers transfer to event', () => {
      /** Constants */
      const amount = BigInt.fromString('5246205398726345');
      const from = aaaTokenAddress;
      const to = user2Address;
      const balanceOf = BigInt.fromString('262059874253345');

      /** Setup test */
      const transferEvent = createTransferEvent(aaaTokenAddress, from, to, amount);
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

      const accountVTokenId = getAccountVTokenId(aaaTokenAddress, to);

      /** AccountVToken */
      assert.fieldEquals(
        'AccountVToken',
        accountVTokenId,
        'accrualBlockNumber',
        transferEvent.block.number.toString(),
      );

      assert.fieldEquals('AccountVToken', accountVTokenId, 'accountBorrowIndexMantissa', '0');
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
      const market = getMarket(aaaTokenAddress);
      assert.assertNotNull(market);
      if (!market) {
        return;
      }

      const actualMintAmount = BigInt.fromI64(12);
      const halfActualMintAmount = actualMintAmount.div(BigInt.fromI64(2));
      const mintTokens = BigInt.fromI64(10);
      const accountBalance = mintTokens;
      const halfMintTokens = mintTokens.div(BigInt.fromI64(2));

      const supplier01 = user1Address;
      let mintEvent = createMintEvent(
        aaaTokenAddress,
        supplier01,
        actualMintAmount,
        mintTokens,
        accountBalance,
      );
      createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier01, mintTokens);

      handleMint(mintEvent);

      const supplier02 = user2Address;
      mintEvent = createMintEvent(
        aaaTokenAddress,
        supplier02,
        actualMintAmount,
        mintTokens,
        accountBalance,
      );
      createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier02, mintTokens);

      handleMint(mintEvent);

      let redeemEvent = createRedeemEvent(
        aaaTokenAddress,
        supplier02,
        actualMintAmount,
        mintTokens,
        zeroBigInt32,
      );
      createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier02, zeroBigInt32);

      handleRedeem(redeemEvent);

      redeemEvent = createRedeemEvent(
        aaaTokenAddress,
        supplier01,
        halfActualMintAmount,
        halfMintTokens,
        halfMintTokens,
      );
      createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier01, halfMintTokens);

      handleRedeem(redeemEvent);

      redeemEvent = createRedeemEvent(
        aaaTokenAddress,
        supplier01,
        halfActualMintAmount,
        halfMintTokens,
        zeroBigInt32,
      );
      createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier01, zeroBigInt32);

      handleRedeem(redeemEvent);
    });

    test('registers increase and decrease in the market borrower count', () => {
      const market = getMarket(aaaTokenAddress);
      assert.assertNotNull(market);
      if (!market) {
        return;
      }

      const borrowAmount = BigInt.fromI64(10);
      const halfBorrowAmountTokens = borrowAmount.div(BigInt.fromI64(2));

      const borrower01 = user1Address;
      let borrowEvent = createBorrowEvent(
        aaaTokenAddress,
        borrower01,
        borrowAmount,
        borrowAmount,
        borrowAmount,
      );

      handleBorrow(borrowEvent);

      const borrower02 = user2Address;
      borrowEvent = createBorrowEvent(
        aaaTokenAddress,
        borrower02,
        borrowAmount,
        borrowAmount,
        borrowAmount,
      );

      handleBorrow(borrowEvent);

      let repayEvent = createRepayBorrowEvent(
        aaaTokenAddress,
        borrower02,
        borrower02,
        borrowAmount,
        zeroBigInt32,
        zeroBigInt32,
      );

      handleRepayBorrow(repayEvent);

      repayEvent = createRepayBorrowEvent(
        aaaTokenAddress,
        borrower01,
        borrower01,
        halfBorrowAmountTokens,
        halfBorrowAmountTokens,
        halfBorrowAmountTokens,
      );

      handleRepayBorrow(repayEvent);

      repayEvent = createRepayBorrowEvent(
        aaaTokenAddress,
        borrower01,
        borrower01,
        halfBorrowAmountTokens,
        zeroBigInt32,
        zeroBigInt32,
      );

      handleRepayBorrow(repayEvent);
    });
  });
});
