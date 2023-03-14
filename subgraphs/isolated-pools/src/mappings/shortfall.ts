import { Address, Bytes } from '@graphprotocol/graph-ts';

import {
  AuctionClosed,
  AuctionRestarted,
  AuctionStarted,
  BidPlaced,
} from '../../generated/templates/Shortfall/Shortfall';
import { AUCTION_ENDED, AUCTION_STARTED, AuctionTypes } from '../constants/index';
import { getOrCreateAuction } from '../operations/getOrCreate';

export function handleAuctionStarted(event: AuctionStarted): void {
  const comptrollerAddress = event.params.comptroller;
  const auction = getOrCreateAuction(comptrollerAddress);

  const markets = event.params.markets.map<Bytes>((address: Address) =>
    Bytes.fromHexString(address.toHexString()),
  );

  auction.status = AUCTION_STARTED;
  auction.startBlock = event.params.startBlock;
  auction.type = AuctionTypes[event.params.auctionType];
  auction.markets = markets;
  auction.marketsDebt = event.params.marketsDebt;
  auction.seizedRiskFund = event.params.seizedRiskFund;
  auction.startBidBps = event.params.startBidBps;

  auction.save();
}

export function handleAuctionRestarted(event: AuctionRestarted): void {
  const comptrollerAddress = event.params.comptroller;
  const auction = getOrCreateAuction(comptrollerAddress);

  // the smart contract currently sets the auction to ENDED, then proceeds to call
  // startAuction, which will fire handleAuctionStarted again
  auction.status = AUCTION_ENDED;

  auction.save();
}

export function handleAuctionClosed(event: AuctionClosed): void {
  const comptrollerAddress = event.params.comptroller;
  const auction = getOrCreateAuction(comptrollerAddress);

  const markets = event.params.markets.map<Bytes>((address: Address) =>
    Bytes.fromHexString(address.toHexString()),
  );

  auction.status = AUCTION_ENDED;
  auction.highestBidder = event.params.highestBidder;
  auction.highestBidBps = event.params.highestBidBps;
  auction.markets = markets;
  auction.marketsDebt = event.params.marketDebt;
  auction.seizedRiskFund = event.params.seizedRiskFind;

  auction.save();
}

// this is fired  when a new highest bid
export function handleBidPlaced(event: BidPlaced): void {
  const comptrollerAddress = event.params.comptroller;
  const auction = getOrCreateAuction(comptrollerAddress);

  auction.highestBidBlock = event.block.number;
  auction.highestBidBps = event.params.bidBps;
  auction.highestBidder = event.params.bidder;

  auction.save();
}
