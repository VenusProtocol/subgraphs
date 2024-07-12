import { Address, BigInt, ByteArray, Bytes, crypto, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  ClearPayload,
  ExecuteRemoteProposal,
  NewAccessControlManager,
  SetMaxDailyLimit,
  SetTrustedRemoteAddress,
  StorePayload,
  TrustedRemoteRemoved,
} from '../../../generated/OmnichainProposalSender/OmnichainProposalSender';
import { omnichainProposalSenderAddress } from '../../../src/constants/addresses';

export const createEncodedProposalPayload = (
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  proposalType: i32,
  proposalId: BigInt,
): Bytes => {
  const payload = [
    ethereum.Value.fromAddressArray(targets),
    ethereum.Value.fromUnsignedBigIntArray(values),
    ethereum.Value.fromStringArray(signatures),
    ethereum.Value.fromBytesArray(calldatas),
    ethereum.Value.fromI32(proposalType),
  ];
  const payloadWithId = [
    ethereum.Value.fromTuple(changetype<ethereum.Tuple>(payload)),
    ethereum.Value.fromUnsignedBigInt(proposalId),
  ];
  const encoded = ethereum.encode(
    ethereum.Value.fromTuple(changetype<ethereum.Tuple>(payloadWithId)),
  )!;
  return encoded;
};

export const createSetTrustedRemoteAddressEvent = (
  remoteChainId: i32,
  oldRemoteAddress: Address,
  newRemoteAddress: Address,
): SetTrustedRemoteAddress => {
  const event = changetype<SetTrustedRemoteAddress>(newMockEvent());
  event.parameters = [];

  const remoteChainIdParam = new ethereum.EventParam(
    'remoteChainId',
    ethereum.Value.fromI32(remoteChainId),
  );
  event.parameters.push(remoteChainIdParam);

  const oldRemoteAddressParam = new ethereum.EventParam(
    'oldRemoteAddress',
    ethereum.Value.fromBytes(oldRemoteAddress),
  );
  event.parameters.push(oldRemoteAddressParam);

  const encoded = ethereum.encode(
    ethereum.Value.fromTuple(
      changetype<ethereum.Tuple>([
        ethereum.Value.fromAddress(newRemoteAddress),
        ethereum.Value.fromAddress(omnichainProposalSenderAddress),
      ]),
    ),
  )!;
  const newRemoteAddressParam = new ethereum.EventParam(
    'newRemoteAddress',
    ethereum.Value.fromBytes(encoded),
  );
  event.parameters.push(newRemoteAddressParam);
  return event;
};

export const createExecuteRemoteProposalEvent = (
  remoteChainId: i32,
  proposalId: BigInt,
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  proposalType: i32,
): ExecuteRemoteProposal => {
  const event = changetype<ExecuteRemoteProposal>(newMockEvent());
  event.parameters = [];

  const remoteChainIdParam = new ethereum.EventParam(
    'remoteChainId',
    ethereum.Value.fromI32(remoteChainId),
  );
  event.parameters.push(remoteChainIdParam);

  const proposalIdParam = new ethereum.EventParam(
    'proposalId',
    ethereum.Value.fromUnsignedBigInt(proposalId),
  );
  event.parameters.push(proposalIdParam);

  const payload = createEncodedProposalPayload(
    targets,
    values,
    signatures,
    calldatas,
    proposalType,
    proposalId,
  );

  const payloadParam = new ethereum.EventParam('payload', ethereum.Value.fromBytes(payload));
  event.parameters.push(payloadParam);

  return event;
};

export const createClearPayloadEvent = (
  proposalId: BigInt,
  executionHash: Bytes,
  includeWithdrawn: boolean,
): ClearPayload => {
  const event = changetype<ClearPayload>(newMockEvent());
  event.parameters = [];

  const proposalIdParam = new ethereum.EventParam(
    'proposalId',
    ethereum.Value.fromUnsignedBigInt(proposalId),
  );
  event.parameters.push(proposalIdParam);

  const executionHashParam = new ethereum.EventParam(
    'executionHash',
    ethereum.Value.fromFixedBytes(executionHash),
  );
  event.parameters.push(executionHashParam);

  if (includeWithdrawn) {
    const fallbackTopic = Bytes.fromByteArray(
      crypto.keccak256(ByteArray.fromUTF8('FallbackWithdraw(indexed address,uint256)')),
    );
    const clearPayloadTopic = Bytes.fromByteArray(
      crypto.keccak256(ByteArray.fromUTF8('FallbackWithdraw(indexed address,uint256)')),
    );
    event.receipt!.logs[0].topics = [fallbackTopic, clearPayloadTopic];
  }

  return event;
};

export const createStorePayloadEvent = (
  remoteChainId: i32,
  proposalId: BigInt,
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  proposalType: i32,
  adapterParams: Bytes,
  value: i32,
  reason: Bytes,
): StorePayload => {
  const event = changetype<StorePayload>(newMockEvent());
  event.parameters = [];

  const payloadIdParam = new ethereum.EventParam(
    'payloadId',
    ethereum.Value.fromUnsignedBigInt(proposalId),
  );
  event.parameters.push(payloadIdParam);

  const remoteChainIdParam = new ethereum.EventParam(
    'remoteChainId',
    ethereum.Value.fromI32(remoteChainId),
  );
  event.parameters.push(remoteChainIdParam);
  const payload = createEncodedProposalPayload(
    targets,
    values,
    signatures,
    calldatas,
    proposalType,
    proposalId,
  );
  const payloadParam = new ethereum.EventParam('payload', ethereum.Value.fromBytes(payload));
  event.parameters.push(payloadParam);

  const adapterParamsParam = new ethereum.EventParam(
    'adapterParams',
    ethereum.Value.fromBytes(adapterParams),
  );
  event.parameters.push(adapterParamsParam);

  const valueParam = new ethereum.EventParam('value', ethereum.Value.fromI32(value));
  event.parameters.push(valueParam);

  const reasonParam = new ethereum.EventParam('reason', ethereum.Value.fromBytes(reason));
  event.parameters.push(reasonParam);

  return event;
};

export const createNewAccessControlManagerEvent = (
  oldAccessControlManager: Address,
  newAccessControlManager: Address,
): NewAccessControlManager => {
  const event = changetype<NewAccessControlManager>(newMockEvent());
  event.parameters = [];

  const oldAccessControlManagerParam = new ethereum.EventParam(
    'oldAccessControlManager',
    ethereum.Value.fromAddress(oldAccessControlManager),
  );
  event.parameters.push(oldAccessControlManagerParam);

  const newAccessControlManagerParam = new ethereum.EventParam(
    'newAccessControlManager',
    ethereum.Value.fromAddress(newAccessControlManager),
  );
  event.parameters.push(newAccessControlManagerParam);

  return event;
};

export const createSetMaxDailyLimitEvent = (
  chainId: i32,
  oldMaxLimit: i32,
  newMaxLimit: i32,
): SetMaxDailyLimit => {
  const event = changetype<SetMaxDailyLimit>(newMockEvent());
  event.parameters = [];

  const chainIdParam = new ethereum.EventParam('chainId', ethereum.Value.fromI32(chainId));
  event.parameters.push(chainIdParam);

  const oldMaxLimitParam = new ethereum.EventParam(
    'oldMaxLimit',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(oldMaxLimit)),
  );
  event.parameters.push(oldMaxLimitParam);

  const newMaxLimitParam = new ethereum.EventParam(
    'newMaxLimit',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newMaxLimit)),
  );
  event.parameters.push(newMaxLimitParam);
  return event;
};
export const createTrustedRemoteRemovedEvent = (chainId: i32): TrustedRemoteRemoved => {
  const event = changetype<TrustedRemoteRemoved>(newMockEvent());
  event.parameters = [];
  const chainIdParam = new ethereum.EventParam('chainId', ethereum.Value.fromI32(chainId));
  event.parameters.push(chainIdParam);
  return event;
};
