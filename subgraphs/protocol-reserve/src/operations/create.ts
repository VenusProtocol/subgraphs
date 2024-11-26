import { Address } from '@graphprotocol/graph-ts';

import { ConverterNetwork } from '../../generated/schema';
import { TokenConverter as TokenConverterContract } from '../../generated/BTCBPrimeConverter/TokenConverter';
import { RiskFund } from '../../generated/ConverterNetwork/RiskFund';
import { TokenConverter, TokenConverterConfig } from '../../generated/schema';
import { ERC20 } from '../../generated/templates';
import { zeroBigInt32 } from '../constants';
import { riskFundAddress, riskFundConverterAddress } from '../constants/addresses';
import { valueOrNotAvailableAddressIfReverted } from '../utilities';
import {
  getTokenConverterConfigId,
  getTokenConverterId,
  getConverterNetworkId,
} from '../utilities/ids';
import { getOrCreateToken } from './getOrCreate';
import { converterNetworkAddress } from '../constants/addresses';

/**
 * ConverterNetwork is hardcoded in the subgraph definition
 *
 * @param converterNetworkAddress
 * @returns
 */
export function createConverterNetwork(): ConverterNetwork {
  const converterNetwork = new ConverterNetwork(getConverterNetworkId(converterNetworkAddress));
  converterNetwork.address = converterNetworkAddress;

  return converterNetwork;
}

export function createTokenConverter(tokenConverterAddress: Address): TokenConverter {
  const tokenConverterContract = TokenConverterContract.bind(tokenConverterAddress);
  const tokenConverter = new TokenConverter(getTokenConverterId(tokenConverterAddress));
  tokenConverter.destinationAddress = tokenConverterContract.destinationAddress();
  tokenConverter.address = tokenConverterAddress;

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
  tokenConverter.priceOracleAddress = valueOrNotAvailableAddressIfReverted(
    tokenConverterContract.try_priceOracle(),
  );
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
  tokenConverterConfig.tokenOutBalance = zeroBigInt32;
  ERC20.create(tokenAddressOut);

  return tokenConverterConfig;
}
