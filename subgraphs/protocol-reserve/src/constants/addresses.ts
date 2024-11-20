import { Address } from '@graphprotocol/graph-ts';

import { converterNetworkAddress as converterNetworkAddressString, riskFundAddress as riskFundAddressString, riskFundConverterAddress as riskFundConverterAddressString } from './config';

export const converterNetworkAddress = Address.fromString(converterNetworkAddressString);
export const riskFundConverterAddress = Address.fromString(riskFundConverterAddressString);
export const riskFundAddress = Address.fromString(riskFundAddressString);
export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');
