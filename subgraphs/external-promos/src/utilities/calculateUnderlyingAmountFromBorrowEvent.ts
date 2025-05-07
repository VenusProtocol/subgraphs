import { BigDecimal } from '@graphprotocol/graph-ts';
import { Borrow } from '../../generated/schema';
import exponentToBigDecimal from './exponentToBigDecimal';

export const calculateUnderlyingAmountFromBorrowEvent = (
  underlyingAmount: BigDecimal,
  vToken: Borrow,
): BigDecimal =>
  underlyingAmount
    .div(exponentToBigDecimal(vToken.underlyingDecimals))
    .truncate(vToken.underlyingDecimals);
