import { Address } from '@graphprotocol/graph-ts';

import {
  omnichainGovernanceExecutorAddress as omnichainGovernanceExecutorAddressString,
  omnichainGovernanceOwnerAddress as omnichainGovernanceOwnerAddressString,
} from './config';

export const omnichainGovernanceOwnerAddress = Address.fromString(
  omnichainGovernanceOwnerAddressString,
);
export const omnichainGovernanceExecutorAddress = Address.fromString(
  omnichainGovernanceExecutorAddressString,
);
export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');
