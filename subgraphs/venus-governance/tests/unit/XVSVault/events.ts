import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import { Deposit, RequestedWithdrawal } from '../../../generated/XVSVault/XVSVault';
import { mockXvsAddress } from '../../common/constants';

export function createXvsDepositEvent(user: Address, amount: BigInt): Deposit {
  const event = changetype<Deposit>(newMockEvent());
  event.parameters = [];

  const userParam = new ethereum.EventParam('user', ethereum.Value.fromAddress(user));
  event.parameters.push(userParam);

  const rewardTokenParam = new ethereum.EventParam(
    'rewardToken',
    ethereum.Value.fromAddress(mockXvsAddress),
  );
  event.parameters.push(rewardTokenParam);

  const pidParam = new ethereum.EventParam('pid', ethereum.Value.fromUnsignedBigInt(new BigInt(0)));
  event.parameters.push(pidParam);

  const amountParam = new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(amount));
  event.parameters.push(amountParam);
  return event;
}

export function createXvsWithdrawlRequestedEvent(
  user: Address,
  amount: BigInt,
): RequestedWithdrawal {
  const event = changetype<RequestedWithdrawal>(newMockEvent());
  event.parameters = [];

  const userParam = new ethereum.EventParam('user', ethereum.Value.fromAddress(user));
  event.parameters.push(userParam);

  const rewardTokenParam = new ethereum.EventParam(
    'rewardToken',
    ethereum.Value.fromAddress(mockXvsAddress),
  );
  event.parameters.push(rewardTokenParam);

  const pidParam = new ethereum.EventParam('pid', ethereum.Value.fromUnsignedBigInt(new BigInt(0)));
  event.parameters.push(pidParam);

  const amountParam = new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(amount));
  event.parameters.push(amountParam);
  return event;
}
