import { Address } from '@graphprotocol/graph-ts';

import {
  poolLensAddress as poolLensAddressString,
  poolRegistryAddress as poolRegistryAddressString,
} from './config';

export const poolRegistryAddress = Address.fromString(poolRegistryAddressString);

export const vBnbAddress = Address.fromString('0xa07c5b74c9b40447a954e1466938b865b6bbea36');

export const poolLensAddress = Address.fromString(poolLensAddressString);

export const priceOracleAddress = Address.fromString('0xb0b0000000000000000000000000000000000000');

export const pauseGuardianAddress = Address.fromString(
  '0xd0d0000000000000000000000000000000000000',
);

export const aaaTokenAddress = Address.fromString('0x0000000000000000000000000000000000000aaa');
