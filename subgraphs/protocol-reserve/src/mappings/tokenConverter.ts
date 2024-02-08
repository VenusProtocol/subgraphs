import {
  BaseAssetUpdated,
  ConversionConfigUpdated,
  ConversionPaused,
  ConversionResumed,
  ConverterNetworkAddressUpdated,
  DestinationAddressUpdated,
} from '../../generated/BTCBPrimeConverter/TokenConverter';
import { getOrCreateTokenConverter } from '../operations/getOrCreate';
import { updateOrCreateTokenConverterConfig } from '../operations/updateOrCreate';
import { getConverterNetworkId } from '../utilities/ids';

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
