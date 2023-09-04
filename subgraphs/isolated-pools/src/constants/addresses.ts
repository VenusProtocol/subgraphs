import { Address } from '@graphprotocol/graph-ts';

import {
  poolLensAddress as poolLensAddressString,
  poolRegistryAddress as poolRegistryAddressString,
} from './config';

export const poolRegistryAddress = Address.fromString(poolRegistryAddressString);

export const poolLensAddress = Address.fromString(poolLensAddressString);

export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');
