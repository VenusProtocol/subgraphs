import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

import exponentToBigDecimal from '../utilities/exponentToBigDecimal';

export const NOT_AVAILABLE_BIG_INT = BigInt.fromString('-1');
export const NOT_AVAILABLE_BIG_DECIMAL = BigDecimal.fromString('-1');

export const zeroBigDecimal = BigDecimal.fromString('0');
export const zeroBigInt32 = BigInt.fromString('0');
export const oneBigInt = BigInt.fromString('1');

export const mantissaFactor = 18;
export const defaultMantissaFactorBigDecimal: BigDecimal = exponentToBigDecimal(mantissaFactor);

export const BORROW = 'BORROW';
export const MINT = 'MINT';
export const REDEEM = 'REDEEM';
export const REPAY = 'REPAY';
export const SEIZE = 'SEIZE';
export const LIQUIDATE = 'LIQUIDATE';
export const TRANSFER = 'TRANSFER';
export const ENTER_MARKET = 'ENTER_MARKET';
export const EXIT_MARKET = 'EXIT_MARKET';

export const VERY_HIGH_RISK = 'VERY_HIGH_RISK';
export const HIGH_RISK = 'HIGH_RISK';
export const MEDIUM_RISK = 'MEDIUM_RISK';
export const LOW_RISK = 'LOW_RISK';
export const MINIMAL_RISK = 'MINIMAL_RISK';

export const Actions = [
  MINT,
  REDEEM,
  BORROW,
  REPAY,
  SEIZE,
  LIQUIDATE,
  TRANSFER,
  ENTER_MARKET,
  EXIT_MARKET,
];
