import { Address } from '@graphprotocol/graph-ts';

import { omnichainExecutorOwnerAddress as omnichainExecutorOwnerAddressString, omnichainGovernanceOwnerAddress as omnichainGovernanceOwnerAddressString } from './config';

export const omnichainGovernanceOwnerAddress = Address.fromString(omnichainGovernanceOwnerAddressString);
export const omnichainExecutorOwnerAddress = Address.fromString(omnichainExecutorOwnerAddressString);
export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');
