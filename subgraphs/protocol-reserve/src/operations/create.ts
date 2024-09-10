import { Address } from '@graphprotocol/graph-ts';

import { TokenConverter as TokenConverterContract } from '../../generated/BTCBPrimeConverter/TokenConverter';
import { RiskFund } from '../../generated/ConverterNetwork/RiskFund';
import { TokenConverter, TokenConverterConfig } from '../../generated/schema';
import { riskFundAddress, riskFundConverterAddress } from '../constants/addresses';
import { valueOrNotAvailableAddressIfReverted } from '../utilities';
import { getTokenConverterConfigId, getTokenConverterId } from '../utilities/ids';
import { getOrCreateToken } from './getOrCreate';

export function createTokenConverter(tokenConverterAddress: Address): TokenConverter {
  const tokenConverterContract = TokenConverterContract.bind(tokenConverterAddress);
  const tokenConverter = new TokenConverter(getTokenConverterId(tokenConverterAddress));
  tokenConverter.destinationAddress = tokenConverterContract.destinationAddress();

  if (tokenConverterAddress.equals(riskFundConverterAddress)) {
    const riskFund = RiskFund.bind(riskFundAddress);
    tokenConverter.baseAsset = valueOrNotAvailableAddressIfReverted(
      riskFund.try_convertibleBaseAsset(),
    );
  } else {
    tokenConverter.baseAsset = valueOrNotAvailableAddressIfReverted(
      tokenConverterContract.try_baseAsset(),
    );
  }
  tokenConverter.paused = false;
  tokenConverter.save();
  return tokenConverter;
}

export function createTokenConverterConfig(
  tokenConverterAddress: Address,
  tokenAddressIn: Address,
  tokenAddressOut: Address,
): TokenConverterConfig {
  const tokenConverterConfig = new TokenConverterConfig(
    getTokenConverterConfigId(tokenConverterAddress, tokenAddressIn, tokenAddressOut),
  );
  tokenConverterConfig.tokenConverter = getTokenConverterId(tokenConverterAddress);
  tokenConverterConfig.tokenIn = getOrCreateToken(tokenAddressIn).id;
  tokenConverterConfig.tokenOut = getOrCreateToken(tokenAddressOut).id;
  return tokenConverterConfig;
}
