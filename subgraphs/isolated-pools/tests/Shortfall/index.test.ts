import { Address, BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { AUCTION_ENDED, AUCTION_LARGE_POOL_DEBT, AUCTION_STARTED } from '../../src/constants/index';
import {
  handleAuctionClosed,
  handleAuctionRestarted,
  handleAuctionStarted,
  handleBidPlaced,
} from '../../src/mappings/shortfall';
import { getAuctionId } from '../../src/utilities/ids';
import {
  createAuctionClosedEvent,
  createAuctionRestartedEvent,
  createAuctionStartedEvent,
  createBidPlacedEvent,
} from './events';

const comptrollerAddress = Address.fromString('0x0000000000000000000000000000000000000c0c');
const startBlock = BigInt.fromString('2724018');
const auctionType = 0;
const marketId01 = '0x0000000000000000000000000000000000000111';
const marketId02 = '0x0000000000000000000000000000000000000222';
const marketsString = `[${marketId01}, ${marketId02}]`;
const markets = [Address.fromString(marketId01), Address.fromString(marketId02)];
const market01Debt = '129812941298';
const market02Debt = '79853789987198714';
const marketsDebt = [BigInt.fromString(market01Debt), BigInt.fromString(market02Debt)];
const marketDebtsString = `[${market01Debt}, ${market02Debt}]`;
const seizedRiskFund = BigInt.fromString('8921798127');
const startBidBps = BigInt.fromString('100000');
const bidder = Address.fromString('0x0000000000000000000000000000000000000bbb');
const bidBps = BigInt.fromString('200000');

const cleanup = (): void => {
  clearStore();
};

beforeEach(() => {
  const event = createAuctionStartedEvent(
    comptrollerAddress,
    startBlock,
    auctionType,
    markets,
    marketsDebt,
    seizedRiskFund,
    startBidBps,
  );

  handleAuctionStarted(event);
});

afterEach(() => {
  cleanup();
});

describe('Rewards Distributor', () => {
  test('indexes new auction', () => {
    const id = getAuctionId(comptrollerAddress);
    assert.fieldEquals('Auction', id, 'id', id);
    assert.fieldEquals('Auction', id, 'type', AUCTION_LARGE_POOL_DEBT);
    assert.fieldEquals('Auction', id, 'seizedRiskFund', seizedRiskFund.toString());
    assert.fieldEquals('Auction', id, 'startBlock', startBlock.toString());
    assert.fieldEquals('Auction', id, 'startBidBps', startBidBps.toString());
    assert.fieldEquals('Auction', id, 'markets', marketsString);
    assert.fieldEquals('Auction', id, 'marketsDebt', marketDebtsString);
  });

  test('restarts an auction', () => {
    const event = createAuctionRestartedEvent(comptrollerAddress);

    handleAuctionRestarted(event);

    const id = getAuctionId(comptrollerAddress);
    assert.fieldEquals('Auction', id, 'id', id);
    assert.fieldEquals('Auction', id, 'status', AUCTION_ENDED);
  });

  test('registers a new highest bid', () => {
    const event = createBidPlacedEvent(comptrollerAddress, bidder, bidBps);

    handleBidPlaced(event);

    const id = getAuctionId(comptrollerAddress);
    assert.fieldEquals('Auction', id, 'id', id);
    assert.fieldEquals('Auction', id, 'status', AUCTION_STARTED);
    assert.fieldEquals('Auction', id, 'highestBidBlock', event.block.number.toString());
    assert.fieldEquals('Auction', id, 'highestBidder', bidder.toHexString());
    assert.fieldEquals('Auction', id, 'highestBidBps', bidBps.toString());
  });

  test('closes an auction', () => {
    const newSeizedRiskFund = BigInt.fromString('90000000000');
    const event = createAuctionClosedEvent(
      comptrollerAddress,
      bidder,
      bidBps,
      newSeizedRiskFund,
      markets,
      marketsDebt,
    );

    handleAuctionClosed(event);

    const id = getAuctionId(comptrollerAddress);
    assert.fieldEquals('Auction', id, 'id', id);
    assert.fieldEquals('Auction', id, 'status', AUCTION_ENDED);
    assert.fieldEquals('Auction', id, 'seizedRiskFund', newSeizedRiskFund.toString());
    assert.fieldEquals('Auction', id, 'markets', marketsString);
    assert.fieldEquals('Auction', id, 'marketsDebt', marketDebtsString);
  });
});
