import { Address, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

export function createPermission<E>(address: Address, contractAddress: Address, functionSig: string): E {
  const event = changetype<E>(newMockEvent());
  event.parameters = [];

  const addressParam = new ethereum.EventParam('address', ethereum.Value.fromAddress(address));
  event.parameters.push(addressParam);

  const contractAddressParam = new ethereum.EventParam('contractAddress', ethereum.Value.fromAddress(contractAddress));
  event.parameters.push(contractAddressParam);

  const functionSigParam = new ethereum.EventParam('functionSig', ethereum.Value.fromString(functionSig));
  event.parameters.push(functionSigParam);

  return event;
}
