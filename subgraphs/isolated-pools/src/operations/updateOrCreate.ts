import { Address, BigInt } from '@graphprotocol/graph-ts';

import { MarketPosition, MarketAction } from '../../generated/schema';
import { Actions } from '../constants';
import Box from '../utilities/box';
import { getMarketActionId } from '../utilities/ids';
import { getOrCreateMarketPosition } from './getOrCreate';

export const updateOrCreateMarketPosition = (
  accountAddress: Address,
  marketAddress: Address,
  poolAddress: Address,
  blockNumber: BigInt,
  enteredMarket: Box<boolean> | null = null,
): MarketPosition => {
  let enteredMarketBool = false;
  if (enteredMarket !== null) {
    enteredMarketBool = enteredMarket.value;
  }

  const result = getOrCreateMarketPosition(
    accountAddress,
    marketAddress,
    poolAddress,
    enteredMarketBool,
  );
  const marketPosition = result.entity;
  marketPosition.enteredMarket = enteredMarketBool;
  marketPosition.accrualBlockNumber = blockNumber;
  marketPosition.save();

  return marketPosition;
};

export const updateOrCreateMarketAction = (
  vTokenAddress: Address,
  action: i32,
  pauseState: boolean,
): MarketAction => {
  const id = getMarketActionId(vTokenAddress, action);
  const marketAction = new MarketAction(id);
  marketAction.market = vTokenAddress;
  marketAction.action = Actions[action];
  marketAction.pauseState = pauseState;
  marketAction.save();
  return marketAction;
};
