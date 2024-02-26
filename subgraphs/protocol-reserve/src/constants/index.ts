import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const NOT_AVAILABLE_BIG_INT = BigInt.fromString('-1');
export const NOT_AVAILABLE_BIG_DECIMAL = BigDecimal.fromString('-1');

export const zeroBigDecimal = BigDecimal.fromString('0');
export const zeroBigInt32 = BigInt.fromString('0');
export const oneBigInt = BigInt.fromString('1');

export const mantissaFactor = 18;

export const ConversionAccessibility = ['NONE', 'ALL', 'ONLY_FOR_CONVERTERS', 'ONLY_FOR_USERS'];
