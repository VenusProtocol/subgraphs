import { Address } from '@graphprotocol/graph-ts';

const SEPERATOR = '-';

const joinIds = (idArray: Array<string>): string => idArray.join(SEPERATOR);

export const getTokenConverterId = (address: Address): string => joinIds([address.toHexString()]);

export const getConverterNetworkId = (address: Address): string => joinIds([address.toHexString()]);

type TOKEN_CONVERTER_CONFIG_ID = string;

export const getTokenConverterConfigId = (
  tokenConverterAddress: Address,
  tokenAddressIn: Address,
  tokenAddressOut: Address,
): TOKEN_CONVERTER_CONFIG_ID =>
  joinIds([
    tokenConverterAddress.toHexString(),
    tokenAddressIn.toHexString(),
    tokenAddressOut.toHexString(),
  ]);
