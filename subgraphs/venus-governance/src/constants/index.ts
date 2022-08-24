import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const PENDING = 'PENDING';
export const CANCELLED = 'CANCELLED';
export const EXECUTED = 'EXECUTED';
export const QUEUED = 'QUEUED';
export const ACTIVE = 'ACTIVE';

// Ids
export const GOVERNANCE = 'GOVERNANCE';
