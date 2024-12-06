import { Address } from '@graphprotocol/graph-ts';

import { ERC20 } from '../../generated/RiskFundConverter/ERC20';
import { Token, TokenConverter, TokenConverterConfig } from '../../generated/schema';
import { getAssetId } from '../utilities/ids';
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

/**
 * Creates and Token object with symbol and address
 *
 * @param asset Address of the token
 * @returns Token
 */
export function getOrCreateToken(asset: Address): Token {
  let tokenEntity = Token.load(getAssetId(asset));

  if (!tokenEntity) {
    const erc20 = ERC20.bind(asset);
    tokenEntity = new Token(getAssetId(asset));
    tokenEntity.address = asset;
    tokenEntity.symbol = erc20.symbol();
    tokenEntity.decimals = erc20.decimals();
    tokenEntity.save();
  }
  return tokenEntity;
}
