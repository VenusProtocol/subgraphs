import { BigDecimal } from '@graphprotocol/graph-ts';
import { Supply } from '../../generated/schema';
import exponentToBigDecimal from './exponentToBigDecimal';

export const calculateUnderlyingAmountFromMintEvent = (
  underlyingAmount: BigDecimal,
  vToken: Supply,
): BigDecimal =>
  underlyingAmount
    .div(exponentToBigDecimal(vToken.underlyingDecimals))
    .truncate(vToken.underlyingDecimals);
