import { Address } from '@graphprotocol/graph-ts';

import {
  poolRegistryAddress as poolRegistryAddressString,
  vBifiAddress as vBifiAddressString,
} from './config';

export const poolRegistryAddress = Address.fromString(poolRegistryAddressString);

export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');

export const vBifiAddress = Address.fromString(vBifiAddressString);
