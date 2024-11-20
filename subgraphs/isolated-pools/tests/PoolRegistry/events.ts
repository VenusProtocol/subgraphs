import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import { PoolNameSet as PoolNameSetEvent, PoolRegistered as PoolRegisteredEvent } from '../../generated/PoolRegistry/PoolRegistry';

export const createPoolRegisteredEvent = (comptrollerAddress: Address): PoolRegisteredEvent => {
  const event = changetype<PoolRegisteredEvent>(newMockEvent());

  event.parameters = [];
  const comptrollerParam = new ethereum.EventParam('comptroller', ethereum.Value.fromAddress(comptrollerAddress));
  event.parameters.push(comptrollerParam);

  const tupleArray: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(comptrollerAddress),
    ethereum.Value.fromString('Pool One'),
    ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000000')),
    ethereum.Value.fromAddress(comptrollerAddress),
    ethereum.Value.fromUnsignedBigInt(new BigInt(1000000)),
    ethereum.Value.fromUnsignedBigInt(new BigInt(1659579)),
  ];
  const tuple = changetype<ethereum.Tuple>(tupleArray);
  const tupleValue = ethereum.Value.fromTuple(tuple);

  const poolParam = new ethereum.EventParam('pool', tupleValue);
  event.parameters.push(poolParam);
  return event;
};

export const createPoolNameSetEvent = (comptrollerAddress: Address, oldName: string, newName: string): PoolNameSetEvent => {
  const event = changetype<PoolNameSetEvent>(newMockEvent());

  event.parameters = [];

  const indexParam = new ethereum.EventParam('comptroller', ethereum.Value.fromAddress(comptrollerAddress));
  event.parameters.push(indexParam);

  const oldNameParam = new ethereum.EventParam('oldName', ethereum.Value.fromString(oldName));
  event.parameters.push(oldNameParam);

  const newNameParam = new ethereum.EventParam('newName', ethereum.Value.fromString(newName));
  event.parameters.push(newNameParam);

  return event;
};
