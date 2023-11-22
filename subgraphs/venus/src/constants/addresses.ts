import { Address } from '@graphprotocol/graph-ts';

import {
  comptrollerAddress as comptrollerAddressString,
  vBnbAddress as vBnbAddressString,
} from './config';

export const vBnbAddress = Address.fromString(vBnbAddressString);
export const comptrollerAddress = Address.fromString(comptrollerAddressString);
export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');
