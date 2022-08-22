import { BigDecimal } from '@graphprotocol/graph-ts';

import exponentToBigDecimal from '../utilities/exponentToBigDecimal';

export const zeroBigDecimal = BigDecimal.fromString('0');

export const mantissaFactor = 18;
export const defaultMantissaFactorBigDecimal: BigDecimal = exponentToBigDecimal(mantissaFactor);

export const vTokenDecimals = 8;
export const vTokenDecimalsBigDecimal: BigDecimal = exponentToBigDecimal(vTokenDecimals);

export const BORROW = 'BORROW';
export const MINT = 'MINT';
export const REDEEM = 'REDEEM';
export const REPAY_BORROW = 'REPAY_BORROW';
export const LIQUIDATE_BORROW = 'LIQUIDATE_BORROW';
export const TRANSFER = 'TRANSFER';
