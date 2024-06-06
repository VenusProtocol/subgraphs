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

import {
  BORROW,
  LIQUIDATE,
  MINT,
  REDEEM,
  REPAY,
  TRANSFER,
  oneBigInt,
  zeroBigInt32,
} from '../../src/constants';
import { handleMarketAdded, handlePoolRegistered } from '../../src/mappings/poolRegistry';
import {
  handleAccrueInterest,
  handleBadDebtIncreased,
  handleBorrow,
  handleLiquidateBorrow,
  handleMint,
  handleNewAccessControlManager,
  handleNewMarketInterestRateModel,
  handleNewReserveFactor,
  handleRedeem,
  handleRepayBorrow,
  handleReservesAdded,
  handleSpreadReservesReduced,
  handleTransfer,
} from '../../src/mappings/vToken';
import { getMarket } from '../../src/operations/get';
import { getBadDebtEventId } from '../../src/utilities/ids';
import { getAccountVTokenId, getTransactionEventId } from '../../src/utilities/ids';
import { createMarketAddedEvent } from '../Pool/events';
import { createPoolRegisteredEvent } from '../PoolRegistry/events';
import {
  createAccrueInterestEvent,
  createBadDebtIncreasedEvent,
  createBorrowEvent,
  createLiquidateBorrowEvent,
  createMintEvent,
  createNewAccessControlManagerEvent,
  createNewMarketInterestRateModelEvent,
  createNewReserveFactorEvent,
  createRedeemEvent,
  createRepayBorrowEvent,
  createReservesAddedEvent,
  createSpreadReservesReducedEvent,
  createTransferEvent,
} from './events';
import { createAccountVTokenBalanceOfMock, createPoolRegistryMock } from './mocks';
import { createMarketMock, createPriceOracleMock, createVBep20AndUnderlyingMock } from './mocks';

const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
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

  createPoolRegistryMock([
    [
      ethereum.Value.fromString('Gamer Pool'),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000072')),
      ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000c0c')),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9000000)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(6235232)),
    ],
  ]);

  createAccountVTokenBalanceOfMock(aaaTokenAddress, user1Address, zeroBigInt32);
  createAccountVTokenBalanceOfMock(aaaTokenAddress, user2Address, zeroBigInt32);
});

beforeEach(() => {
  // Create Pool
  const poolRegisteredEvent = createPoolRegisteredEvent(comptrollerAddress);

  handlePoolRegistered(poolRegisteredEvent);
  // Add Market
  const marketAddedEvent = createMarketAddedEvent(comptrollerAddress, aaaTokenAddress);

  handleMarketAdded(marketAddedEvent);
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
    createMockedFunction(
      aaaTokenAddress,
      'getAccountSnapshot',
      'getAccountSnapshot(address):(uint256,uint256,uint256,uint256)',
    )
      .withArgs([ethereum.Value.fromAddress(minter)])
      .returns([
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(mintTokens),
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(oneBigInt),
      ]);

    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }

    handleMint(mintEvent);
    const id = getTransactionEventId(
      mintEvent.transaction.hash,
      mintEvent.transactionLogIndex,
    ).toHexString();
    assert.fieldEquals('Transaction', id, 'id', id);
    assert.fieldEquals('Transaction', id, 'type', MINT);
    assert.fieldEquals('Transaction', id, 'from', mintEvent.address.toHexString());
    assert.fieldEquals('Transaction', id, 'amountMantissa', actualMintAmount.toString());
    assert.fieldEquals('Transaction', id, 'to', minter.toHexString());
    assert.fieldEquals('Transaction', id, 'blockNumber', mintEvent.block.number.toString());
    assert.fieldEquals('Transaction', id, 'blockTime', mintEvent.block.timestamp.toString());

    // AccountVToken
    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, minter).toHexString();
    assert.fieldEquals('AccountVToken', accountVTokenId, 'account', minter.toHexString());
    assert.fieldEquals('AccountVToken', accountVTokenId, 'market', aaaTokenAddress.toHexString());
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      oneBigInt.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountSupplyBalanceMantissa',
      accountBalance.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountBorrowBalanceMantissa',
      zeroBigInt32.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'totalUnderlyingRedeemedMantissa',
      zeroBigInt32.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountBorrowIndexMantissa',
      zeroBigInt32.toString(),
    );
  });

  test('registers redeem event', () => {
    const redeemer = user2Address;
    const actualRedeemAmount = BigInt.fromString('124620530798726345');
    const redeemTokens = BigInt.fromString('37035970026454');
    const accountBalance = zeroBigInt32;
    const redeemEvent = createRedeemEvent(
      aaaTokenAddress,
      redeemer,
      actualRedeemAmount,
      redeemTokens,
      accountBalance,
    );
    createMockedFunction(
      aaaTokenAddress,
      'getAccountSnapshot',
      'getAccountSnapshot(address):(uint256,uint256,uint256,uint256)',
    )
      .withArgs([ethereum.Value.fromAddress(redeemer)])
      .returns([
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(zeroBigInt32),
        ethereum.Value.fromSignedBigInt(oneBigInt),
      ]);
    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }

    handleRedeem(redeemEvent);
    const id = getTransactionEventId(
      redeemEvent.transaction.hash,
      redeemEvent.transactionLogIndex,
    ).toHexString();
    assert.fieldEquals('Transaction', id, 'id', id);
    assert.fieldEquals('Transaction', id, 'type', REDEEM);
    assert.fieldEquals('Transaction', id, 'from', redeemEvent.address.toHexString());
    assert.fieldEquals('Transaction', id, 'amountMantissa', actualRedeemAmount.toString());
    assert.fieldEquals('Transaction', id, 'to', redeemer.toHexString());
    assert.fieldEquals('Transaction', id, 'blockNumber', redeemEvent.block.number.toString());
    assert.fieldEquals('Transaction', id, 'blockTime', redeemEvent.block.timestamp.toString());

    // AccountVToken
    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, redeemer).toHexString();
    assert.fieldEquals('AccountVToken', accountVTokenId, 'account', redeemer.toHexString());
    assert.fieldEquals('AccountVToken', accountVTokenId, 'market', aaaTokenAddress.toHexString());
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      oneBigInt.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountSupplyBalanceMantissa',
      zeroBigInt32.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountBorrowBalanceMantissa',
      zeroBigInt32.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'totalUnderlyingRedeemedMantissa',
      zeroBigInt32.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountBorrowIndexMantissa',
      zeroBigInt32.toString(),
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

    const transactionId = getTransactionEventId(
      borrowEvent.transaction.hash,
      borrowEvent.transactionLogIndex,
    ).toHexString();
    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, borrower).toHexString();
    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }

    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', BORROW);
    assert.fieldEquals('Transaction', transactionId, 'from', borrowEvent.address.toHexString());
    assert.fieldEquals('Transaction', transactionId, 'to', borrower.toHexString());
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockNumber',
      borrowEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockTime',
      borrowEvent.block.timestamp.toString(),
    );

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      borrowEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountBorrowBalanceMantissa',
      accountBorrows.toString(),
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

    const transactionId = getTransactionEventId(
      repayBorrowEvent.transaction.hash,
      repayBorrowEvent.transactionLogIndex,
    ).toHexString();
    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, borrower).toHexString();
    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }

    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', REPAY);
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'from',
      repayBorrowEvent.address.toHexString(),
    );
    assert.fieldEquals('Transaction', transactionId, 'to', borrower.toHexString());
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockNumber',
      repayBorrowEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockTime',
      repayBorrowEvent.block.timestamp.toString(),
    );

    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      repayBorrowEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountBorrowBalanceMantissa',
      accountBorrows.toString(),
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
    const vTokenCollateral = tokenAddress;

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

    const transactionId = getTransactionEventId(
      liquidateBorrowEvent.transaction.hash,
      liquidateBorrowEvent.transactionLogIndex,
    ).toHexString();
    const market = getMarket(aaaTokenAddress);
    assert.assertNotNull(market);
    if (!market) {
      return;
    }

    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', LIQUIDATE);
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'from',
      liquidateBorrowEvent.address.toHexString(),
    );
    assert.fieldEquals('Transaction', transactionId, 'to', borrower.toHexString());
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockNumber',
      liquidateBorrowEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockTime',
      liquidateBorrowEvent.block.timestamp.toString(),
    );
  });

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
    assertMarketDocument('totalSupplyMantissa', '13325839781677697472');
    assertMarketDocument('exchangeRateMantissa', '365045823500000000000000');
    assertMarketDocument('borrowIndexMantissa', '300000000000000000000');
    assertMarketDocument('reservesMantissa', '5128924555022289393');
    assertMarketDocument('totalBorrowsMantissa', '2641234234636158123');
    assertMarketDocument('cashMantissa', '1418171344423412457');
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
      'reserveFactorMantissa',
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

    const transactionId = getTransactionEventId(
      transferEvent.transaction.hash,
      transferEvent.transactionLogIndex,
    ).toHexString();
    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, from).toHexString();

    /** Transaction */
    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', TRANSFER);
    assert.fieldEquals('Transaction', transactionId, 'from', from.toHexString());
    assert.fieldEquals('Transaction', transactionId, 'to', to.toHexString());
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockNumber',
      transferEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockTime',
      transferEvent.block.timestamp.toString(),
    );
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
      '53371549778058610525',
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

    const transactionId = getTransactionEventId(
      transferEvent.transaction.hash,
      transferEvent.transactionLogIndex,
    ).toHexString();
    const accountVTokenId = getAccountVTokenId(aaaTokenAddress, to).toHexString();

    /** Transaction */
    assert.fieldEquals('Transaction', transactionId, 'id', transactionId);
    assert.fieldEquals('Transaction', transactionId, 'type', TRANSFER);
    assert.fieldEquals('Transaction', transactionId, 'to', to.toHexString());
    assert.fieldEquals('Transaction', transactionId, 'from', from.toHexString());
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockNumber',
      transferEvent.block.number.toString(),
    );
    assert.fieldEquals(
      'Transaction',
      transactionId,
      'blockTime',
      transferEvent.block.timestamp.toString(),
    );
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

  test('registers bad debt increased', () => {
    const borrower = Address.fromString('0x0000000000000000000000000000000000000111');
    const badDebtDelta = BigInt.fromI64(300);
    const badDebtOld = BigInt.fromI64(1000);
    const badDebtNew = BigInt.fromI64(700);

    const badDebtIncreasedEvent = createBadDebtIncreasedEvent(
      aaaTokenAddress,
      borrower,
      badDebtDelta,
      badDebtOld,
      badDebtNew,
    );

    const accountVTokenTBadDebtId = getBadDebtEventId(
      badDebtIncreasedEvent.transaction.hash,
      badDebtIncreasedEvent.transaction.index,
    ).toHexString();

    handleBadDebtIncreased(badDebtIncreasedEvent);
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHexString(),
      'badDebtMantissa',
      badDebtNew.toString(),
    );
    assert.fieldEquals(
      'AccountVTokenBadDebt',
      accountVTokenTBadDebtId,
      'account',
      getAccountVTokenId(
        badDebtIncreasedEvent.address,
        badDebtIncreasedEvent.params.borrower,
      ).toHexString(),
    );
    assert.fieldEquals(
      'AccountVTokenBadDebt',
      accountVTokenTBadDebtId,
      'amountMantissa',
      badDebtDelta.toString(),
    );
    assert.fieldEquals(
      'AccountVTokenBadDebt',
      accountVTokenTBadDebtId,
      'timestamp',
      badDebtIncreasedEvent.block.timestamp.toString(),
    );
    assert.fieldEquals(
      'AccountVTokenBadDebt',
      accountVTokenTBadDebtId,
      'block',
      badDebtIncreasedEvent.block.number.toString(),
    );
  });

  test('market registers its new access control manager', () => {
    const oldAccessControlManager = Address.fromString(
      '0x0000000000000000000000000000000000000aaa',
    );
    const newAccessControlManager = Address.fromString(
      '0x0000000000000000000000000000000000000bbb',
    );

    const newAccessControlManagerEvent = createNewAccessControlManagerEvent(
      aaaTokenAddress,
      oldAccessControlManager,
      newAccessControlManager,
    );

    handleNewAccessControlManager(newAccessControlManagerEvent);
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHexString(),
      'accessControlManagerAddress',
      newAccessControlManager.toHexString(),
    );
  });

  test('registers market reserve increase', () => {
    const benefactor = Address.fromString('0x0000000000000000000000000000000000000b00');
    const addAmount = BigInt.fromString('112233445566778899');
    const newTotalReserves = BigInt.fromString('2222334455667788990');

    const reservesAddedEvent = createReservesAddedEvent(
      aaaTokenAddress,
      benefactor,
      addAmount,
      newTotalReserves,
    );

    handleReservesAdded(reservesAddedEvent);
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHexString(),
      'reservesMantissa',
      newTotalReserves.toString(),
    );
  });

  test('registers market reserve decrease', () => {
    const benefactor = Address.fromString('0x0000000000000000000000000000000000000b00');
    const reduceAmount = BigInt.fromString('100000000000000000');
    const newTotalReserves = BigInt.fromString('9111222333444555666');

    const reservesReducedEvent = createSpreadReservesReducedEvent(
      aaaTokenAddress,
      benefactor,
      reduceAmount,
      newTotalReserves,
    );

    handleSpreadReservesReduced(reservesReducedEvent);
    assert.fieldEquals(
      'Market',
      aaaTokenAddress.toHexString(),
      'reservesMantissa',
      '9111222333444555666',
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
    let mintEvent = createMintEvent(
      aaaTokenAddress,
      supplier01,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );
    createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier01, mintTokens);

    handleMint(mintEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '1');

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
    assert.fieldEquals('Market', marketId, 'supplierCount', '2');

    let redeemEvent = createRedeemEvent(
      aaaTokenAddress,
      supplier02,
      actualMintAmount,
      mintTokens,
      zeroBigInt32,
    );
    createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier02, zeroBigInt32);

    handleRedeem(redeemEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '1');

    redeemEvent = createRedeemEvent(
      aaaTokenAddress,
      supplier01,
      halfActualMintAmount,
      halfMintTokens,
      halfMintTokens,
    );
    createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier01, halfMintTokens);

    handleRedeem(redeemEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '1');

    redeemEvent = createRedeemEvent(
      aaaTokenAddress,
      supplier01,
      halfActualMintAmount,
      halfMintTokens,
      zeroBigInt32,
    );
    createAccountVTokenBalanceOfMock(aaaTokenAddress, supplier01, zeroBigInt32);

    handleRedeem(redeemEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '0');
  });

  test('registers increase and decrease in the market borrower count', () => {
    const market = getMarket(aaaTokenAddress)!;
    const marketId = market.id.toHexString();
    assert.assertNotNull(market);
    if (!market) {
      return;
    }
    assert.fieldEquals('Market', marketId, 'borrowerCount', '0');

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
    assert.fieldEquals('Market', marketId, 'borrowerCount', '1');

    const borrower02 = user2Address;
    borrowEvent = createBorrowEvent(
      aaaTokenAddress,
      borrower02,
      borrowAmount,
      borrowAmount,
      borrowAmount,
    );

    handleBorrow(borrowEvent);
    assert.fieldEquals('Market', marketId, 'borrowerCount', '2');

    let repayEvent = createRepayBorrowEvent(
      aaaTokenAddress,
      borrower02,
      borrower02,
      borrowAmount,
      zeroBigInt32,
      zeroBigInt32,
    );

    handleRepayBorrow(repayEvent);
    assert.fieldEquals('Market', marketId, 'borrowerCount', '1');

    repayEvent = createRepayBorrowEvent(
      aaaTokenAddress,
      borrower01,
      borrower01,
      halfBorrowAmountTokens,
      halfBorrowAmountTokens,
      halfBorrowAmountTokens,
    );

    handleRepayBorrow(repayEvent);
    assert.fieldEquals('Market', marketId, 'borrowerCount', '1');

    repayEvent = createRepayBorrowEvent(
      aaaTokenAddress,
      borrower01,
      borrower01,
      halfBorrowAmountTokens,
      zeroBigInt32,
      zeroBigInt32,
    );

    handleRepayBorrow(repayEvent);
    assert.fieldEquals('Market', marketId, 'borrowerCount', '0');
  });
});
