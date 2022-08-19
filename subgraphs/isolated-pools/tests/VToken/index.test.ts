import { Address, BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { MINT, vTokenDecimals, vTokenDecimalsBigDecimal } from '../../src/constants';
import { handleMarketListed } from '../../src/mappings/pool';
import { handlePoolRegistered } from '../../src/mappings/poolRegistry';
import { handleMint } from '../../src/mappings/vToken';
import { readMarket } from '../../src/operations/read';
import exponentToBigDecimal from '../../src/utilities/exponentToBigDecimal';
import { getTransactionEventId } from '../../src/utilities/ids';
import { createMarketListedEvent } from '../Pool/events';
import { createPoolRegisteredEvent } from '../PoolRegistry/events';
import { createMintEvent } from './events';
import { createVBep20AndUnderlyingMock } from './mocks';

const vTokenAddress = Address.fromString('0x0000000000000000000000000000000000000a0a');
const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000b0b');
const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
const user1Address = Address.fromString('0x0000000000000000000000000000000000000101');

const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');

const cleanup = (): void => {
  clearStore();
};

beforeAll(() => {
  createVBep20AndUnderlyingMock(
    vTokenAddress,
    tokenAddress,
    comptrollerAddress,
    'AAA Coin',
    'AAA',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
  );
});

beforeEach(() => {
  // Create Pool
  const index = new BigInt(0);
  const poolRegisteredEvent = createPoolRegisteredEvent(index, comptrollerAddress);

  handlePoolRegistered(poolRegisteredEvent);
  // Add Market
  const marketListedEvent = createMarketListedEvent(vTokenAddress);

  handleMarketListed(marketListedEvent);
});

afterEach(() => {
  cleanup();
});

describe('VToken', () => {
  test('registers mint event', () => {
    const minter = user1Address;
    const actualMintAmount = BigInt.fromI64(124620530798726345);
    const mintTokens = BigInt.fromI64(37035970026454);
    const mintEvent = createMintEvent(vTokenAddress, minter, actualMintAmount, mintTokens);
    const market = readMarket(vTokenAddress);

    handleMint(mintEvent);
    const id = getTransactionEventId(mintEvent.transaction.hash, mintEvent.transactionLogIndex);
    assert.fieldEquals('Transaction', id, 'id', id);
    assert.fieldEquals('Transaction', id, 'type', MINT);
    assert.fieldEquals('Transaction', id, 'from', mintEvent.address.toHexString());
    assert.fieldEquals(
      'Transaction',
      id,
      'amount',
      mintTokens.toBigDecimal().div(vTokenDecimalsBigDecimal).truncate(vTokenDecimals).toString(),
    );
    assert.fieldEquals('Transaction', id, 'to', minter.toHexString());
    assert.fieldEquals('Transaction', id, 'blockNumber', mintEvent.block.number.toString());
    assert.fieldEquals('Transaction', id, 'blockTime', mintEvent.block.timestamp.toString());
    assert.fieldEquals(
      'Transaction',
      id,
      'underlyingAmount',
      actualMintAmount
        .toBigDecimal()
        .div(exponentToBigDecimal(market.underlyingDecimals))
        .truncate(market.underlyingDecimals)
        .toString(),
    );
  });
});
