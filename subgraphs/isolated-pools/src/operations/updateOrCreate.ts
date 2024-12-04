import { Address, BigInt } from '@graphprotocol/graph-ts';

import { AccountVToken, MarketAction } from '../../generated/schema';
import { Actions } from '../constants';
import Box from '../utilities/box';
import { getMarketActionId } from '../utilities/ids';
import { getOrCreateAccountVToken } from './getOrCreate';

export const updateOrCreateAccountVToken = (
  accountAddress: Address,
  marketAddress: Address,
  poolAddress: Address,
  blockNumber: BigInt,
  enteredMarket: Box<boolean> | null = null,
): AccountVToken => {
  let enteredMarketBool = false;
  if (enteredMarket !== null) {
    enteredMarketBool = enteredMarket.value;
  }

  const result = getOrCreateAccountVToken(
    accountAddress,
    marketAddress,
    poolAddress,
    enteredMarketBool,
  );
  const accountVToken = result.entity;
  accountVToken.enteredMarket = enteredMarketBool;
  accountVToken.accrualBlockNumber = blockNumber;
  accountVToken.save();

  return accountVToken;
};

export const updateOrCreateMarketAction = (
  vTokenAddress: Address,
  action: i32,
  pauseState: boolean,
): MarketAction => {
  const id = getMarketActionId(vTokenAddress, action);
  const marketAction = new MarketAction(id);
  marketAction.vToken = vTokenAddress;
  marketAction.action = Actions[action];
  marketAction.pauseState = pauseState;
  marketAction.save();
  return marketAction;
};
