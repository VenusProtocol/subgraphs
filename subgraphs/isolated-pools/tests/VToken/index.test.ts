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
import { PoolInfo, createAccountVTokenBalanceOfMock, createPoolRegistryMock } from './mocks';
import { createMarketMock, createPriceOracleMock, createVBep20AndUnderlyingMock } from './mocks';

const underlying1Address = Address.fromString('0x0000000000000000000000000000000000000111');
const underlying2Address = Address.fromString('0x0000000000000000000000000000000000000222');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
const user1Address = Address.fromString('0x0000000000000000000000000000000000000101');
const user2Address = Address.fromString('0x0000000000000000000000000000000000000202');
const aTokenAddress = Address.fromString('0x0000000000000000000000000000000000000aaa');
const bTokenAddress = Address.fromString('0x0000000000000000000000000000000000000bbb');

const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');

const underlyingPrice = BigInt.fromString('15000000000000000');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createVBep20AndUnderlyingMock(
    aTokenAddress,
    underlying1Address,
    comptrollerAddress,
    'AAA Coin',
    'AAA',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
    underlyingPrice,
  );

  createVBep20AndUnderlyingMock(
    bTokenAddress,
    underlying2Address,
    comptrollerAddress,
    'AAA Coin',
    'AAA',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
    underlyingPrice,
  );

  createMarketMock(aTokenAddress);

  createPriceOracleMock([[ethereum.Value.fromAddress(aTokenAddress), ethereum.Value.fromI32(99)]]);

  createPoolRegistryMock([
    new PoolInfo(
      'Gamer Pool',
      Address.fromString('0x0000000000000000000000000000000000000072'),
      Address.fromString('0x0000000000000000000000000000000000000c0c'),
    ),
  ]);

  createAccountVTokenBalanceOfMock(aTokenAddress, user1Address, zeroBigInt32);
  createAccountVTokenBalanceOfMock(bTokenAddress, user1Address, zeroBigInt32);
  const balanceOfAccount = BigInt.fromI32(100);
  createMockedFunction(
    bTokenAddress,
    'getAccountSnapshot',
    'getAccountSnapshot(address):(uint256,uint256,uint256,uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(user1Address)])
    .returns([
      ethereum.Value.fromSignedBigInt(zeroBigInt32),
      ethereum.Value.fromSignedBigInt(balanceOfAccount),
      ethereum.Value.fromSignedBigInt(zeroBigInt32),
      ethereum.Value.fromSignedBigInt(oneBigInt),
    ]);

  createMockedFunction(
    aTokenAddress,
    'borrowBalanceStored',
    'borrowBalanceStored(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(user1Address)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(5))]);

  createMockedFunction(
    aTokenAddress,
    'borrowBalanceStored',
    'borrowBalanceStored(address):(uint256)',
  )
    .withArgs([ethereum.Value.fromAddress(user2Address)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(5))]);
});

beforeEach(() => {
  // Create Pool
  const poolRegisteredEvent = createPoolRegisteredEvent(comptrollerAddress);

  handlePoolRegistered(poolRegisteredEvent);
  // Add Markets
  let marketAddedEvent = createMarketAddedEvent(comptrollerAddress, aTokenAddress);

  handleMarketAdded(marketAddedEvent);
  marketAddedEvent = createMarketAddedEvent(comptrollerAddress, bTokenAddress);
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
      aTokenAddress,
      minter,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );
    createMockedFunction(
      aTokenAddress,
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

    const market = getMarket(aTokenAddress);
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
    const accountVTokenId = getAccountVTokenId(aTokenAddress, minter).toHexString();
    assert.fieldEquals('AccountVToken', accountVTokenId, 'account', minter.toHexString());
    assert.fieldEquals('AccountVToken', accountVTokenId, 'market', aTokenAddress.toHexString());
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      oneBigInt.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountVTokenSupplyBalanceMantissa',
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
      aTokenAddress,
      redeemer,
      actualRedeemAmount,
      redeemTokens,
      accountBalance,
    );
    createMockedFunction(
      aTokenAddress,
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
    const market = getMarket(aTokenAddress);
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
    const accountVTokenId = getAccountVTokenId(aTokenAddress, redeemer).toHexString();
    assert.fieldEquals('AccountVToken', accountVTokenId, 'account', redeemer.toHexString());
    assert.fieldEquals('AccountVToken', accountVTokenId, 'market', aTokenAddress.toHexString());
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accrualBlockNumber',
      oneBigInt.toString(),
    );
    assert.fieldEquals(
      'AccountVToken',
      accountVTokenId,
      'accountVTokenSupplyBalanceMantissa',
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
      aTokenAddress,
      borrower,
      borrowAmount,
      accountBorrows,
      totalBorrows,
    );

    createMockedFunction(
      aTokenAddress,
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
    const accountVTokenId = getAccountVTokenId(aTokenAddress, borrower).toHexString();
    const market = getMarket(aTokenAddress);
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
      aTokenAddress,
      payer,
      borrower,
      repayAmount,
      accountBorrows,
      totalBorrows,
    );

    createMockedFunction(
      aTokenAddress,
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
    const accountVTokenId = getAccountVTokenId(aTokenAddress, borrower).toHexString();
    const market = getMarket(aTokenAddress);
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
    const vTokenCollateral = bTokenAddress;

    /** Setup test */
    const liquidateBorrowEvent = createLiquidateBorrowEvent(
      aTokenAddress,
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
    const market = getMarket(aTokenAddress);
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
      aTokenAddress,
      cashPrior,
      interestAccumulated,
      borrowIndex,
      totalBorrows,
    );

    /** Fire Event */
    handleAccrueInterest(accrueInterestEvent);

    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', aTokenAddress.toHexString(), key, value);
    };

    assertMarketDocument('accrualBlockNumber', '999');
    assertMarketDocument('blockTimestamp', accrueInterestEvent.block.timestamp.toString());
    assertMarketDocument('totalSupplyVTokenMantissa', '36504567163409'); // value from mock
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
      aTokenAddress,
      oldReserveFactor,
      newReserveFactor,
    );

    handleNewReserveFactor(reserveFactorEvent);
    assert.fieldEquals('Market', aTokenAddress.toHex(), 'id', aTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      aTokenAddress.toHex(),
      'reserveFactorMantissa',
      newReserveFactor.toString(),
    );
  });

  test('registers transfer from event', () => {
    /** Constants */
    const from = user2Address; // 101
    const to = user1Address;
    const amount = BigInt.fromString('146205398726345');
    const balanceOf = BigInt.fromString('262059874253345');

    /** Setup test */
    const transferEvent = createTransferEvent(aTokenAddress, from, to, amount);
    createMockedFunction(
      aTokenAddress,
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
    const accountVTokenId = getAccountVTokenId(aTokenAddress, from).toHexString();

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

    assert.fieldEquals('AccountVToken', accountVTokenId, 'totalUnderlyingRedeemedMantissa', '0');
  });

  test('registers transfer to event', () => {
    /** Constants */
    const amount = BigInt.fromString('5246205398726345');
    const from = user1Address;
    const to = user2Address;
    const balanceOf = BigInt.fromString('262059874253345');

    /** Setup test */
    const transferEvent = createTransferEvent(aTokenAddress, from, to, amount);
    createMockedFunction(
      aTokenAddress,
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
      aTokenAddress,
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
    const accountVTokenId = getAccountVTokenId(aTokenAddress, to).toHexString();

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
      aTokenAddress,
      oldInterestRateModel,
      newInterestRateModel,
    );

    handleNewMarketInterestRateModel(newMarketInterestRateModelEvent);
    assert.fieldEquals('Market', aTokenAddress.toHex(), 'id', aTokenAddress.toHexString());
    assert.fieldEquals(
      'Market',
      aTokenAddress.toHex(),
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
      aTokenAddress,
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
      aTokenAddress.toHexString(),
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
      aTokenAddress,
      oldAccessControlManager,
      newAccessControlManager,
    );

    handleNewAccessControlManager(newAccessControlManagerEvent);
    assert.fieldEquals(
      'Market',
      aTokenAddress.toHexString(),
      'accessControlManagerAddress',
      newAccessControlManager.toHexString(),
    );
  });

  test('registers market reserve increase', () => {
    const benefactor = Address.fromString('0x0000000000000000000000000000000000000b00');
    const addAmount = BigInt.fromString('112233445566778899');
    const newTotalReserves = BigInt.fromString('2222334455667788990');

    const reservesAddedEvent = createReservesAddedEvent(
      aTokenAddress,
      benefactor,
      addAmount,
      newTotalReserves,
    );

    handleReservesAdded(reservesAddedEvent);
    assert.fieldEquals(
      'Market',
      aTokenAddress.toHexString(),
      'reservesMantissa',
      newTotalReserves.toString(),
    );
  });

  test('registers market reserve decrease', () => {
    const benefactor = Address.fromString('0x0000000000000000000000000000000000000b00');
    const reduceAmount = BigInt.fromString('100000000000000000');
    const newTotalReserves = BigInt.fromString('9111222333444555666');

    const reservesReducedEvent = createSpreadReservesReducedEvent(
      aTokenAddress,
      benefactor,
      reduceAmount,
      newTotalReserves,
    );

    handleSpreadReservesReduced(reservesReducedEvent);
    assert.fieldEquals(
      'Market',
      aTokenAddress.toHexString(),
      'reservesMantissa',
      '9111222333444555666',
    );
  });

  test('registers increase and decrease in the market supplier count', () => {
    const market = getMarket(aTokenAddress)!;
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
      aTokenAddress,
      supplier01,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );
    createAccountVTokenBalanceOfMock(aTokenAddress, supplier01, mintTokens);

    handleMint(mintEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '1');

    const supplier02 = user2Address;
    mintEvent = createMintEvent(
      aTokenAddress,
      supplier02,
      actualMintAmount,
      mintTokens,
      accountBalance,
    );
    createAccountVTokenBalanceOfMock(aTokenAddress, supplier02, mintTokens);

    handleMint(mintEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '2');

    let redeemEvent = createRedeemEvent(
      aTokenAddress,
      supplier02,
      actualMintAmount,
      mintTokens,
      zeroBigInt32,
    );
    createAccountVTokenBalanceOfMock(aTokenAddress, supplier02, zeroBigInt32);

    handleRedeem(redeemEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '1');

    redeemEvent = createRedeemEvent(
      aTokenAddress,
      supplier01,
      halfActualMintAmount,
      halfMintTokens,
      halfMintTokens,
    );
    createAccountVTokenBalanceOfMock(aTokenAddress, supplier01, halfMintTokens);

    handleRedeem(redeemEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '1');

    redeemEvent = createRedeemEvent(
      aTokenAddress,
      supplier01,
      halfActualMintAmount,
      halfMintTokens,
      zeroBigInt32,
    );
    createAccountVTokenBalanceOfMock(aTokenAddress, supplier01, zeroBigInt32);

    handleRedeem(redeemEvent);
    assert.fieldEquals('Market', marketId, 'supplierCount', '0');
  });

  test('registers increase and decrease in the market borrower count', () => {
    const market = getMarket(aTokenAddress)!;
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
      aTokenAddress,
      borrower01,
      borrowAmount,
      borrowAmount,
      borrowAmount,
    );

    handleBorrow(borrowEvent);
    assert.fieldEquals('Market', marketId, 'borrowerCount', '1');

    const borrower02 = user2Address;
    borrowEvent = createBorrowEvent(
      aTokenAddress,
      borrower02,
      borrowAmount,
      borrowAmount,
      borrowAmount,
    );

    handleBorrow(borrowEvent);
    assert.fieldEquals('Market', marketId, 'borrowerCount', '2');

    let repayEvent = createRepayBorrowEvent(
      aTokenAddress,
      borrower02,
      borrower02,
      borrowAmount,
      zeroBigInt32,
      zeroBigInt32,
    );

    handleRepayBorrow(repayEvent);
    assert.fieldEquals('Market', marketId, 'borrowerCount', '1');

    repayEvent = createRepayBorrowEvent(
      aTokenAddress,
      borrower01,
      borrower01,
      halfBorrowAmountTokens,
      halfBorrowAmountTokens,
      halfBorrowAmountTokens,
    );

    handleRepayBorrow(repayEvent);
    assert.fieldEquals('Market', marketId, 'borrowerCount', '1');

    repayEvent = createRepayBorrowEvent(
      aTokenAddress,
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
