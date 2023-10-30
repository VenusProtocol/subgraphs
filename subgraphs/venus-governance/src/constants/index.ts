import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

// Ids
export const GOVERNANCE = 'GOVERNANCE';
export const SEPERATOR = '-';

// Vote support
export const FOR = 'FOR';
export const AGAINST = 'AGAINST';
export const ABSTAIN = 'ABSTAIN';

// Proposal Type
export const NORMAL = 'NORMAL';
export const FAST_TRACK = 'FAST_TRACK';
export const CRITICAL = 'CRITICAL';

// Permission types
export const GRANTED = 'GRANTED';
export const REVOKED = 'REVOKED';
