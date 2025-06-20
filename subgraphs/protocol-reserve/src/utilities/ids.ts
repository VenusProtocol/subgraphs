import { Address, Bytes } from '@graphprotocol/graph-ts';

export const getTokenConverterId = (address: Address): Bytes => address;

export const getConverterNetworkId = (address: Address): Bytes => address;

export const getTokenConverterConfigId = (
  tokenConverterAddress: Address,
  tokenAddressIn: Address,
  tokenAddressOut: Address,
): Bytes => tokenConverterAddress.concat(tokenAddressIn).concat(tokenAddressOut);

export const getAssetId = (asset: Address): Bytes => asset;

export const getDestinationAmountId = (
  tokenConverterAddress: Address,
  destinationAddress: Address,
  tokenAddress: Address,
): Bytes => tokenConverterAddress.concat(destinationAddress).concat(tokenAddress);
