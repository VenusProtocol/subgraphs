import { ConverterAdded, ConverterRemoved } from '../../generated/ConverterNetwork/ConverterNetwork';
import { getOrCreateConverterNetwork, getOrCreateTokenConverter } from '../operations/getOrCreate';
import { getConverterNetworkId } from '../utilities/ids';

export function handleConverterAdded(event: ConverterAdded): void {
  getOrCreateConverterNetwork(event.address);
  const tokenConverter = getOrCreateTokenConverter(event.params.converter);
  tokenConverter.converterNetwork = getConverterNetworkId(event.address);
  tokenConverter.save();
}

export function handleConverterRemoved(event: ConverterRemoved): void {
  const tokenConverter = getOrCreateTokenConverter(event.params.converter);
  tokenConverter.converterNetwork = null;
  tokenConverter.save();
}
