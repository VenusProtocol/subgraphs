import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  AuctionClosed as AuctionClosedEvent,
  AuctionRestarted as AuctionRestartedEvent,
  AuctionStarted as AuctionStartedEvent,
  BidPlaced as BidPlacedEvent,
} from '../../generated/templates/Shortfall/Shortfall';

export const createAuctionStartedEvent = (
  comptrollerAddress: Address,
  startBlock: BigInt,
  auctionType: i32,
  markets: Address[],
  marketsDebt: BigInt[],
  seizedRiskFund: BigInt,
  startBidBps: BigInt,
): AuctionStartedEvent => {
  const event = changetype<AuctionStartedEvent>(newMockEvent());
  event.parameters = [];

  const comptrollerParam = new ethereum.EventParam(
    'comptroller',
    ethereum.Value.fromAddress(comptrollerAddress),
  );
  event.parameters.push(comptrollerParam);

  const startBlockValue = ethereum.Value.fromUnsignedBigInt(startBlock);
  const startBlockParam = new ethereum.EventParam('startBlock', startBlockValue);
  event.parameters.push(startBlockParam);

  const auctionTypeNum = ethereum.Value.fromI32(auctionType);
  const auctionTypeParam = new ethereum.EventParam('auctionType', auctionTypeNum);
  event.parameters.push(auctionTypeParam);

  const marketsArray = ethereum.Value.fromAddressArray(markets);
  const marketsParam = new ethereum.EventParam('markets', marketsArray);
  event.parameters.push(marketsParam);

  const marketsDebtArray = ethereum.Value.fromUnsignedBigIntArray(marketsDebt);
  const marketsDebtParam = new ethereum.EventParam('marketsDebt', marketsDebtArray);
  event.parameters.push(marketsDebtParam);

  const seizedRiskFundValue = ethereum.Value.fromUnsignedBigInt(seizedRiskFund);
  const seizedRiskFundParam = new ethereum.EventParam('seizedRiskFund', seizedRiskFundValue);
  event.parameters.push(seizedRiskFundParam);

  const startBidBpsValue = ethereum.Value.fromUnsignedBigInt(startBidBps);
  const startBidBpsParam = new ethereum.EventParam('startBidBps', startBidBpsValue);
  event.parameters.push(startBidBpsParam);

  return event;
};

export const createAuctionRestartedEvent = (comptrollerAddress: Address): AuctionRestartedEvent => {
  const event = changetype<AuctionRestartedEvent>(newMockEvent());
  event.parameters = [];

  const comptrollerParam = new ethereum.EventParam(
    'comptroller',
    ethereum.Value.fromAddress(comptrollerAddress),
  );
  event.parameters.push(comptrollerParam);

  return event;
};

export const createAuctionClosedEvent = (
  comptrollerAddress: Address,
  highestBidder: Address,
  highestBidBps: BigInt,
  seizedRiskFund: BigInt,
  markets: Address[],
  marketsDebt: BigInt[],
): AuctionClosedEvent => {
  const event = changetype<AuctionClosedEvent>(newMockEvent());
  event.parameters = [];

  const comptrollerParam = new ethereum.EventParam(
    'comptroller',
    ethereum.Value.fromAddress(comptrollerAddress),
  );
  event.parameters.push(comptrollerParam);

  const highestBidderParam = new ethereum.EventParam(
    'highestBidder',
    ethereum.Value.fromAddress(highestBidder),
  );
  event.parameters.push(highestBidderParam);

  const highestBidBpsParam = new ethereum.EventParam(
    'highestBidBps',
    ethereum.Value.fromUnsignedBigInt(highestBidBps),
  );
  event.parameters.push(highestBidBpsParam);

  const seizedRiskFundParam = new ethereum.EventParam(
    'seizedRiskFund',
    ethereum.Value.fromUnsignedBigInt(seizedRiskFund),
  );
  event.parameters.push(seizedRiskFundParam);

  const marketsArray = ethereum.Value.fromAddressArray(markets);
  const marketsParam = new ethereum.EventParam('markets', marketsArray);
  event.parameters.push(marketsParam);

  const marketsDebtArray = ethereum.Value.fromUnsignedBigIntArray(marketsDebt);
  const marketsDebtParam = new ethereum.EventParam('marketsDebt', marketsDebtArray);
  event.parameters.push(marketsDebtParam);

  return event;
};

export const createBidPlacedEvent = (
  comptrollerAddress: Address,
  bidder: Address,
  bidBps: BigInt,
): BidPlacedEvent => {
  const event = changetype<BidPlacedEvent>(newMockEvent());
  event.parameters = [];

  const comptrollerParam = new ethereum.EventParam(
    'comptroller',
    ethereum.Value.fromAddress(comptrollerAddress),
  );
  event.parameters.push(comptrollerParam);

  const bidBpsValue = ethereum.Value.fromSignedBigInt(bidBps);
  const bidBpsParam = new ethereum.EventParam('bidBps', bidBpsValue);
  event.parameters.push(bidBpsParam);

  const bidderParam = new ethereum.EventParam('bidder', ethereum.Value.fromAddress(bidder));
  event.parameters.push(bidderParam);

  return event;
};
