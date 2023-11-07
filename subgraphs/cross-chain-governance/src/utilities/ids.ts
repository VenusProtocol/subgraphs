import { Address, BigInt } from '@graphprotocol/graph-ts';

import { GOVERNANCE } from '../constants';

export const getGovernanceId = (): string => GOVERNANCE;

export const getProposalId = (proposalId: BigInt) => proposalId.toString();

export const getTimelockId = (address: Address) => address.toHexString();
