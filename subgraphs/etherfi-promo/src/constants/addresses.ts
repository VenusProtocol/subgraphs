import { Address } from '@graphprotocol/graph-ts';

import { vWeEthAddress as vWeEthAddressString, weEthAddress as weEthAddressString } from './config';

export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');
export const vWeEthAddress = Address.fromString(vWeEthAddressString);
export const weEthAddress = Address.fromString(weEthAddressString);
