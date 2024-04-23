import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const NOT_AVAILABLE_BIG_INT = BigInt.fromString('-1');
export const NOT_AVAILABLE_BIG_DECIMAL = BigDecimal.fromString('-1');

export const zeroBigDecimal = BigDecimal.fromString('0');
export const zeroBigInt32 = BigInt.fromString('0');
export const oneBigInt = BigInt.fromString('1');

export const mantissaFactor = 18;
export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');

export const SUPPLY = 'SUPPLY';
export const BORROW = 'BORROW';
