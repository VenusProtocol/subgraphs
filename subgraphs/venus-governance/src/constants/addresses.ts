import { Address } from '@graphprotocol/graph-ts';

import { governorBravoDelegatorAddress as governorBravoDelegatorAddressString, omnichainProposalSenderAddress as omnichainProposalSenderAddressString } from './config';

export const governorBravoDelegatorAddress = Address.fromString(governorBravoDelegatorAddressString);

export const omnichainProposalSenderAddress = Address.fromString(omnichainProposalSenderAddressString);

export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');
