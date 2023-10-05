import { Address } from '@graphprotocol/graph-ts';

import { governorBravoDelegateAddress as governorBravoDelegateAddressString } from './config';

export const governorBravoDelegateAddress = Address.fromString(governorBravoDelegateAddressString);

export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');
