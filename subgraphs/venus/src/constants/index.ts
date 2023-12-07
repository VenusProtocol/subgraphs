import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

import { exponentToBigDecimal } from '../utilities';

export const BORROW = 'BORROW';
export const MINT = 'MINT';
export const REDEEM = 'REDEEM';
export const REPAY = 'REPAY';
export const SEIZE = 'SEIZE';
export const LIQUIDATE = 'LIQUIDATE';
export const TRANSFER = 'TRANSFER';
export const ENTER_MARKET = 'ENTER_MARKET';
export const EXIT_MARKET = 'EXIT_MARKET';

export const mantissaFactor = 18;
export const mantissaFactorBigDecimal: BigDecimal = exponentToBigDecimal(mantissaFactor);

export const NOT_AVAILABLE_BIG_INT = BigInt.fromString('-1');
export const NOT_AVAILABLE_BIG_DECIMAL = BigDecimal.fromString('-1');

export const zeroBigDecimal = BigDecimal.fromString('0');
export const zeroBigInt32 = BigInt.fromString('0');
export const oneBigInt = BigInt.fromString('1');

export const DUST_THRESHOLD = BigInt.fromString('10');

export const Actions = [
  'MINT',
  'REDEEM',
  'BORROW',
  'REPAY',
  'SEIZE',
  'LIQUIDATE',
  'TRANSFER',
  'ENTER_MARKET',
  'EXIT_MARKET',
];
