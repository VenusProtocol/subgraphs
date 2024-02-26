import { Address } from '@graphprotocol/graph-ts';

import { ConverterNetwork, TokenConverter, TokenConverterConfig } from '../../generated/schema';
import { getConverterNetworkId } from '../utilities/ids';
import { createTokenConverter, createTokenConverterConfig } from './create';
import { getTokenConverter, getTokenConverterConfig } from './get';

/**
 * TokenConverters are hardcoded in the subgraph definition
 *
 * @param tokenConverterAddress
 * @returns TokenConverter Entity
 */
export function getOrCreateTokenConverter(tokenConverterAddress: Address): TokenConverter {
  let tokenConverter = getTokenConverter(tokenConverterAddress);

  if (!tokenConverter) {
    tokenConverter = createTokenConverter(tokenConverterAddress);
  }

  return tokenConverter;
}

/**
 * ConverterNetwork is hardcoded in the subgraph definition
 *
 * @param converterNetworkAddress
 * @returns
 */
export function getOrCreateConverterNetwork(converterNetworkAddress: Address): ConverterNetwork {
  let converterNetwork = ConverterNetwork.load(getConverterNetworkId(converterNetworkAddress));

  if (!converterNetwork) {
    converterNetwork = new ConverterNetwork(getConverterNetworkId(converterNetworkAddress));
  }

  return converterNetwork;
}

export function getOrCreateTokenConverterConfig(
  tokenConverterAddress: Address,
  tokenAddressIn: Address,
  tokenAddressOut: Address,
): TokenConverterConfig {
  let tokenConverterConfig = getTokenConverterConfig(
    tokenConverterAddress,
    tokenAddressIn,
    tokenAddressOut,
  );

  if (!tokenConverterConfig) {
    tokenConverterConfig = createTokenConverterConfig(
      tokenConverterAddress,
      tokenAddressIn,
      tokenAddressOut,
    );
  }
  return tokenConverterConfig;
}
