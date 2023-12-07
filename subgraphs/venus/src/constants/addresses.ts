import { Address } from '@graphprotocol/graph-ts';

import { comptrollerAddress as comptrollerAddressString } from './config';

export const comptrollerAddress = Address.fromString(comptrollerAddressString);
export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');
