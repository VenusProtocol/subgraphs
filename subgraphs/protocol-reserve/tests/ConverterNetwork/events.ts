import { Address, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  ConverterAdded,
  ConverterRemoved,
} from '../../generated/ConverterNetwork/ConverterNetwork';

export const createConverterAddedEvent = (
  converterNetworkAddress: Address,
  tokenConverterAddress: Address,
): ConverterAdded => {
  const event = changetype<ConverterAdded>(newMockEvent());
  event.address = converterNetworkAddress;
  event.parameters = [];
  const converterParam = new ethereum.EventParam(
    'converter',
    ethereum.Value.fromAddress(tokenConverterAddress),
  );
  event.parameters.push(converterParam);

  return event;
};

export const createConverterRemovedEvent = (
  converterNetworkAddress: Address,
  tokenConverterAddress: Address,
): ConverterRemoved => {
  const event = changetype<ConverterRemoved>(newMockEvent());
  event.address = converterNetworkAddress;
  event.parameters = [];
  const converterParam = new ethereum.EventParam(
    'converter',
    ethereum.Value.fromAddress(tokenConverterAddress),
  );
  event.parameters.push(converterParam);
  return event;
};
