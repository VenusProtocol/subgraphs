import { Address, BigInt } from '@graphprotocol/graph-ts';

import { AccountVToken } from '../../generated/schema';
import Box from '../utilities/box';
import { getAccountVTokenId } from '../utilities/ids';
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
