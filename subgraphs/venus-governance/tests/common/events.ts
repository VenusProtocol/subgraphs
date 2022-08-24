import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

export function createProposalCreatedEvent<E>(
  id: i32,
  proposer: Address,
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  startBlock: BigInt,
  endBlock: BigInt,
  description: string,
): E {
  const event = changetype<E>(newMockEvent());
  event.parameters = [];

  const idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));
  event.parameters.push(idParam);

  const proposerParam = new ethereum.EventParam('proposer', ethereum.Value.fromAddress(proposer));
  event.parameters.push(proposerParam);

  const targetsParam = new ethereum.EventParam('targets', ethereum.Value.fromAddressArray(targets));
  event.parameters.push(targetsParam);

  const valuesParam = new ethereum.EventParam(
    'values',
    ethereum.Value.fromUnsignedBigIntArray(values),
  );
  event.parameters.push(valuesParam);

  const signaturesParam = new ethereum.EventParam(
    'signatures',
    ethereum.Value.fromStringArray(signatures),
  );
  event.parameters.push(signaturesParam);

  const calldatasParam = new ethereum.EventParam(
    'calldatas',
    ethereum.Value.fromBytesArray(calldatas),
  );
  event.parameters.push(calldatasParam);

  const startBlockParam = new ethereum.EventParam(
    'startBlock',
    ethereum.Value.fromUnsignedBigInt(startBlock),
  );
  event.parameters.push(startBlockParam);

  const endBlockParam = new ethereum.EventParam(
    'endBlock',
    ethereum.Value.fromUnsignedBigInt(endBlock),
  );
  event.parameters.push(endBlockParam);

  const descriptionParam = new ethereum.EventParam(
    'description',
    ethereum.Value.fromString(description),
  );
  event.parameters.push(descriptionParam);

  return event;
}
