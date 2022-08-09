import { Address, BigInt } from '@graphprotocol/graph-ts';

import { AccountVToken, PoolAction } from '../../generated/schema';
import Box from '../utilities/box';
import { getAccountVTokenId, getPoolActionId } from '../utilities/ids';
import { getOrCreateAccountVToken } from './getOrCreate';

export const updateOrCreateAccountVToken = (
  accountAddress: Address,
  marketAddress: Address,
  marketSymbol: string,
  blockNumber: BigInt,
  enteredMarket: Box<boolean> | null = null,
): AccountVToken => {
  const accountVTokenId = getAccountVTokenId(marketAddress, accountAddress);

  let enteredMarketBool = false;
  if (enteredMarket !== null) {
    enteredMarketBool = enteredMarket.value;
  }

  const accountVToken = getOrCreateAccountVToken(
    accountVTokenId,
    marketSymbol,
    accountAddress,
    marketAddress,
    enteredMarketBool,
  );
  accountVToken.accrualBlockNumber = blockNumber;
  accountVToken.save();

  return accountVToken;
};

export const updateOrCreatePoolAction = (
  poolAddress: Address,
  action: string,
  pauseState: boolean,
): PoolAction => {
  const id = getPoolActionId(poolAddress, action);
  const poolAction = new PoolAction(id);
  poolAction.pool = poolAddress;
  poolAction.action = action;
  poolAction.pauseState = pauseState;
  poolAction.save();
  return poolAction;
};
