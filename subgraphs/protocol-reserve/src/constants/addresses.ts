import { Address } from '@graphprotocol/graph-ts';

import {
  btcbPrimeConverterAddress as btcbPrimeConverterAddressString,
  converterNetworkAddress as converterNetworkAddressString,
  ethPrimeConverterAddress as ethPrimeConverterAddressString,
  riskFundAddress as riskFundAddressString,
  riskFundConverterAddress as riskFundConverterAddressString,
  usdcPrimeConverterAddress as usdcPrimeConverterAddressString,
  usdtPrimeConverterAddress as usdtPrimeConverterAddressString,
  wbtcPrimeConverterAddress as wbtcPrimeConverterAddressString,
  wethPrimeConverterAddress as wethPrimeConverterAddressString,
  xvsVaultConverterAddress as xvsVaultConverterAddressString,
} from './config';

export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');

const addressFromCleanString = (str: string): Address => {
  if (str.length > 0) {
    return Address.fromString(str);
  }
  return nullAddress;
};

export const converterNetworkAddress = addressFromCleanString(converterNetworkAddressString);
export const riskFundConverterAddress = addressFromCleanString(riskFundConverterAddressString);
export const btcbPrimeConverterAddress = addressFromCleanString(btcbPrimeConverterAddressString);
export const ethPrimeConverterAddress = addressFromCleanString(ethPrimeConverterAddressString);
export const usdcPrimeConverterAddress = addressFromCleanString(usdcPrimeConverterAddressString);
export const usdtPrimeConverterAddress = addressFromCleanString(usdtPrimeConverterAddressString);
export const xvsVaultConverterAddress = addressFromCleanString(xvsVaultConverterAddressString);
export const wbtcPrimeConverterAddress = addressFromCleanString(wbtcPrimeConverterAddressString);
export const wethPrimeConverterAddress = addressFromCleanString(wethPrimeConverterAddressString);

export const riskFundAddress = addressFromCleanString(riskFundAddressString);
