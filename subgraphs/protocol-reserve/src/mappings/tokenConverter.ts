import { ethereum } from '@graphprotocol/graph-ts';

import {
  BaseAssetUpdated,
  ConversionConfigUpdated,
  ConversionPaused,
  ConversionResumed,
  ConverterNetworkAddressUpdated,
  DestinationAddressUpdated,
} from '../../generated/BTCBPrimeConverter/TokenConverter';
import {
  btcbPrimeConverterAddress,
  ethPrimeConverterAddress,
  riskFundConverterAddress,
  usdcPrimeConverterAddress,
  usdtPrimeConverterAddress,
  wbtcPrimeConverterAddress,
  wethPrimeConverterAddress,
  xvsVaultConverterAddress,
} from '../constants/addresses';
import { getOrCreateTokenConverter } from '../operations/getOrCreate';
import { updateOrCreateTokenConverterConfig } from '../operations/updateOrCreate';
import { getConverterNetworkId } from '../utilities/ids';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitializationBtcbPrimeConverter(block: ethereum.Block): void {
  getOrCreateTokenConverter(btcbPrimeConverterAddress);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitializationEthPrimeConverter(block: ethereum.Block): void {
  getOrCreateTokenConverter(ethPrimeConverterAddress);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitializationRiskFundConverter(block: ethereum.Block): void {
  getOrCreateTokenConverter(riskFundConverterAddress);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitializationUsdcPrimeConverter(block: ethereum.Block): void {
  getOrCreateTokenConverter(usdcPrimeConverterAddress);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitializationUsdtPrimeConverter(block: ethereum.Block): void {
  getOrCreateTokenConverter(usdtPrimeConverterAddress);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitializationXvsVaultConverter(block: ethereum.Block): void {
  getOrCreateTokenConverter(xvsVaultConverterAddress);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitializationWbtcPrimeConverter(block: ethereum.Block): void {
  getOrCreateTokenConverter(wbtcPrimeConverterAddress);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitializationWethPrimeConverter(block: ethereum.Block): void {
  getOrCreateTokenConverter(wethPrimeConverterAddress);
}

export function handleConversionConfigUpdated(event: ConversionConfigUpdated): void {
  getOrCreateTokenConverter(event.address);
  updateOrCreateTokenConverterConfig(event.address, event.params);
}

export function handleConversionPaused(event: ConversionPaused): void {
  const tokenConverter = getOrCreateTokenConverter(event.address);
  tokenConverter.paused = true;
  tokenConverter.save();
}

export function handleConversionResumed(event: ConversionResumed): void {
  const tokenConverter = getOrCreateTokenConverter(event.address);
  tokenConverter.paused = false;
  tokenConverter.save();
}

export function handleConverterNetworkAddressUpdated(event: ConverterNetworkAddressUpdated): void {
  const tokenConverter = getOrCreateTokenConverter(event.address);
  tokenConverter.converterNetwork = getConverterNetworkId(event.params.converterNetwork);
  tokenConverter.save();
}

export function handleDestinationAddressUpdated(event: DestinationAddressUpdated): void {
  const tokenConverter = getOrCreateTokenConverter(event.address);
  tokenConverter.destinationAddress = event.params.destinationAddress;
  tokenConverter.save();
}

export function handleBaseAssetUpdated(event: BaseAssetUpdated): void {
  const tokenConverter = getOrCreateTokenConverter(event.address);
  tokenConverter.baseAsset = event.params.newBaseAsset;
  tokenConverter.save();
}
