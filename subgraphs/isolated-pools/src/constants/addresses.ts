import { Address } from '@graphprotocol/graph-ts';

import {
  poolLensAddress as poolLensAddressString,
  poolRegistryAddress as poolRegistryAddressString,
} from './config';

export const poolRegistryAddress = Address.fromString(poolRegistryAddressString);

export const poolLensAddress = Address.fromString(poolLensAddressString);

export const priceOracleAddress = Address.fromString('0xb0b0000000000000000000000000000000000000');
