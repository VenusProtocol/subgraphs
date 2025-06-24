import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  AssetTransferredToDestination,
  BaseAssetUpdated,
  ConvertedExactTokens,
  ConversionConfigUpdated,
  ConversionPaused,
  ConversionResumed,
  ConverterNetworkAddressUpdated,
  DestinationAddressUpdated,
} from '../../generated/BTCBPrimeConverter/TokenConverter';

export const createConversionConfigUpdatedEvent = (
  tokenConverterAddress: Address,
  tokenInAddress: Address,
  tokenOutAddress: Address,
  oldIncentive: string,
  newIncentive: string,
  oldAccess: string,
  newAccess: string,
): ConversionConfigUpdated => {
  const event = changetype<ConversionConfigUpdated>(newMockEvent());
  event.address = tokenConverterAddress;
  event.parameters = [];

  const tokenAddressInParam = new ethereum.EventParam(
    'tokenAddressIn',
    ethereum.Value.fromAddress(tokenInAddress),
  );
  event.parameters.push(tokenAddressInParam);

  const tokenAddressOutParam = new ethereum.EventParam(
    'tokenAddressOut',
    ethereum.Value.fromAddress(tokenOutAddress),
  );
  event.parameters.push(tokenAddressOutParam);

  const oldIncentiveValue = ethereum.Value.fromUnsignedBigInt(BigInt.fromString(oldIncentive));
  const oldIncentiveParam = new ethereum.EventParam('oldIncentive', oldIncentiveValue);
  event.parameters.push(oldIncentiveParam);

  const newIncentiveValue = ethereum.Value.fromUnsignedBigInt(BigInt.fromString(newIncentive));
  const newIncentiveParam = new ethereum.EventParam('newIncentive', newIncentiveValue);
  event.parameters.push(newIncentiveParam);

  const oldAccessValue = ethereum.Value.fromUnsignedBigInt(BigInt.fromString(oldAccess));
  const oldAccessParam = new ethereum.EventParam('oldAccess', oldAccessValue);
  event.parameters.push(oldAccessParam);

  const newAccessValue = ethereum.Value.fromUnsignedBigInt(BigInt.fromString(newAccess));
  const newAccessParam = new ethereum.EventParam('newAccess', newAccessValue);
  event.parameters.push(newAccessParam);

  return event;
};

export const createConversionPausedEvent = (
  tokenConverterAddress: Address,
  sender: Address,
): ConversionPaused => {
  const event = changetype<ConversionPaused>(newMockEvent());
  event.address = tokenConverterAddress;
  event.parameters = [];
  const senderParam = new ethereum.EventParam('sender', ethereum.Value.fromAddress(sender));
  event.parameters.push(senderParam);

  return event;
};

export const createConversionResumedEvent = (
  tokenConverterAddress: Address,
  sender: Address,
): ConversionResumed => {
  const event = changetype<ConversionResumed>(newMockEvent());
  event.address = tokenConverterAddress;
  event.parameters = [];
  const senderParam = new ethereum.EventParam('sender', ethereum.Value.fromAddress(sender));
  event.parameters.push(senderParam);

  return event;
};

export const createConverterNetworkAddressUpdatedEvent = (
  tokenConverterAddress: Address,
  oldConverterNetwork: Address,
  converterNetwork: Address,
): ConverterNetworkAddressUpdated => {
  const event = changetype<ConverterNetworkAddressUpdated>(newMockEvent());
  event.address = tokenConverterAddress;
  event.parameters = [];
  const oldConverterNetworkParam = new ethereum.EventParam(
    'oldConverterNetwork',
    ethereum.Value.fromAddress(oldConverterNetwork),
  );
  event.parameters.push(oldConverterNetworkParam);

  const converterNetworkParam = new ethereum.EventParam(
    'converterNetwork',
    ethereum.Value.fromAddress(converterNetwork),
  );
  event.parameters.push(converterNetworkParam);

  return event;
};

export const createDestinationAddressUpdatedEvent = (
  tokenConverterAddress: Address,
  oldDestinationAddress: Address,
  destinationAddress: Address,
): DestinationAddressUpdated => {
  const event = changetype<DestinationAddressUpdated>(newMockEvent());
  event.address = tokenConverterAddress;
  event.parameters = [];
  const oldDestinationAddressParam = new ethereum.EventParam(
    'oldDestinationAddress',
    ethereum.Value.fromAddress(oldDestinationAddress),
  );
  event.parameters.push(oldDestinationAddressParam);

  const destinationAddressParam = new ethereum.EventParam(
    'destinationAddress',
    ethereum.Value.fromAddress(destinationAddress),
  );
  event.parameters.push(destinationAddressParam);

  return event;
};

export const createBaseAssetUpdatedEvent = (
  tokenConverterAddress: Address,
  oldBaseAsset: Address,
  newBaseAsset: Address,
): BaseAssetUpdated => {
  const event = changetype<BaseAssetUpdated>(newMockEvent());
  event.address = tokenConverterAddress;
  event.parameters = [];
  const oldBaseAssetParam = new ethereum.EventParam(
    'oldBaseAsset',
    ethereum.Value.fromAddress(oldBaseAsset),
  );
  event.parameters.push(oldBaseAssetParam);

  const newBaseAssetParam = new ethereum.EventParam(
    'newBaseAsset',
    ethereum.Value.fromAddress(newBaseAsset),
  );
  event.parameters.push(newBaseAssetParam);

  return event;
};

export const createConvertedEvent = (
  tokenConverterAddress: Address,
  sender: Address,
  receiver: Address,
  tokenAddressIn: Address,
  tokenAddressOut: Address,
  amountIn: string,
  amountOut: string,
): ConvertedExactTokens => {
  const event = changetype<ConvertedExactTokens>(newMockEvent());
  event.address = tokenConverterAddress;
  event.parameters = [];

  const senderParam = new ethereum.EventParam('sender', ethereum.Value.fromAddress(sender));
  event.parameters.push(senderParam);

  const receiverParam = new ethereum.EventParam('receiver', ethereum.Value.fromAddress(receiver));
  event.parameters.push(receiverParam);

  const tokenAddressInParam = new ethereum.EventParam(
    'tokenAddressIn',
    ethereum.Value.fromAddress(tokenAddressIn),
  );
  event.parameters.push(tokenAddressInParam);

  const tokenAddressOutParam = new ethereum.EventParam(
    'tokenAddressOut',
    ethereum.Value.fromAddress(tokenAddressOut),
  );
  event.parameters.push(tokenAddressOutParam);

  const amountInParam = new ethereum.EventParam(
    'amountIn',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(amountIn)),
  );
  event.parameters.push(amountInParam);

  const amountOutParam = new ethereum.EventParam(
    'amountOut',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(amountOut)),
  );
  event.parameters.push(amountOutParam);

  return event;
};

export const createAssetTransferredToDestinationEvent = (
  tokenConverterAddress: Address,
  receiver: Address,
  comptroller: Address,
  asset: Address,
  amount: string,
): AssetTransferredToDestination => {
  const event = changetype<AssetTransferredToDestination>(newMockEvent());
  event.address = tokenConverterAddress;
  event.parameters = [];

  const receiverParam = new ethereum.EventParam('receiver', ethereum.Value.fromAddress(receiver));
  event.parameters.push(receiverParam);

  const comptrollerParam = new ethereum.EventParam(
    'comptroller',
    ethereum.Value.fromAddress(comptroller),
  );
  event.parameters.push(comptrollerParam);

  const assetParam = new ethereum.EventParam('asset', ethereum.Value.fromAddress(asset));
  event.parameters.push(assetParam);

  const amountParam = new ethereum.EventParam(
    'amount',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(amount)),
  );
  event.parameters.push(amountParam);

  return event;
};
