import { Address } from '@graphprotocol/graph-ts';

import { TokenConverter, TokenConverterConfig } from '../../generated/schema';
import { getTokenConverterConfigId, getTokenConverterId } from '../utilities/ids';

export function getTokenConverter(tokenConverterAddress: Address): TokenConverter | null {
  const id = getTokenConverterId(tokenConverterAddress);
  const tokenConverter = TokenConverter.load(id);
  return tokenConverter;
}

export function getTokenConverterConfig(tokenConverterAddress: Address, tokenAddressIn: Address, tokenAddressOut: Address): TokenConverterConfig | null {
  const id = getTokenConverterConfigId(tokenConverterAddress, tokenAddressIn, tokenAddressOut);
  const tokenConverterConfig = TokenConverterConfig.load(id);
  return tokenConverterConfig;
}
