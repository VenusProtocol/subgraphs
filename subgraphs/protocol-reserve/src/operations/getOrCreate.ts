import { Address, BigInt } from '@graphprotocol/graph-ts';

import { ERC20 } from '../../generated/RiskFundConverter/ERC20';
import {
  DestinationAmount,
  Token,
  TokenConverter,
  TokenConverterConfig,
} from '../../generated/schema';
import { getAssetId, getDestinationAmountId, getTokenConverterId } from '../utilities/ids';
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
 * Creates a Token object with symbol and address
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

/**
 * Creates a DestinationAmount object
 *
 * @param asset Address of the token
 * @returns Token
 */
export function getOrCreateDestinationAmount(
  tokenConverterAddress: Address,
  destinationAddress: Address,
  tokenAddress: Address,
): DestinationAmount {
  const entityId = getDestinationAmountId(tokenConverterAddress, destinationAddress, tokenAddress);
  let destinationAmountEntity = DestinationAmount.load(entityId);

  if (!destinationAmountEntity) {
    destinationAmountEntity = new DestinationAmount(entityId);
    destinationAmountEntity.tokenConverter = getTokenConverterId(tokenConverterAddress);
    destinationAmountEntity.token = getOrCreateToken(tokenAddress).id;
    destinationAmountEntity.amount = BigInt.zero();
    destinationAmountEntity.address = destinationAddress;
  }

  return destinationAmountEntity;
}
