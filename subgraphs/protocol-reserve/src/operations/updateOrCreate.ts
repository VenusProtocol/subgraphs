import { Address } from '@graphprotocol/graph-ts';

import { ConversionConfigUpdated__Params } from '../../generated/BTCBPrimeConverter/TokenConverter';
import { ConversionAccessibility } from '../constants/index';
import { getOrCreateTokenConverterConfig } from './getOrCreate';

export function updateOrCreateTokenConverterConfig(tokenConverterAddress: Address, params: ConversionConfigUpdated__Params): void {
  const tokenConverterConfig = getOrCreateTokenConverterConfig(tokenConverterAddress, params.tokenAddressIn, params.tokenAddressOut);
  tokenConverterConfig.incentive = params.newIncentive;
  tokenConverterConfig.access = ConversionAccessibility[params.newAccess];
  tokenConverterConfig.save();
}
