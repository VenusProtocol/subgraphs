import { BigInt } from '@graphprotocol/graph-ts';

import { GOVERNANCE } from '../constants';

export const getGovernanceId = (): string => GOVERNANCE;

export const getProposalId = (proposalId: BigInt): string => proposalId.toString();

export const getGovernanceRouteId = (routeIndex: i32): string => routeIndex.toString();

export const getFailedPayloadId = (nonce: BigInt): string => nonce.toString();
