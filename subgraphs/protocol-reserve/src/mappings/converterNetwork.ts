import { ethereum } from '@graphprotocol/graph-ts';
import {
  ConverterAdded,
  ConverterRemoved,
} from '../../generated/ConverterNetwork/ConverterNetwork';
import { getOrCreateTokenConverter } from '../operations/getOrCreate';
import { createConverterNetwork } from '../operations/create';
import { getConverterNetworkId } from '../utilities/ids';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitializationConverterNetwork(block: ethereum.Block): void {
  createConverterNetwork();
}

export function handleConverterAdded(event: ConverterAdded): void {
  const tokenConverter = getOrCreateTokenConverter(event.params.converter);
  tokenConverter.converterNetwork = getConverterNetworkId(event.address);
  tokenConverter.save();
}

export function handleConverterRemoved(event: ConverterRemoved): void {
  const tokenConverter = getOrCreateTokenConverter(event.params.converter);
  tokenConverter.converterNetwork = null;
  tokenConverter.save();
}
