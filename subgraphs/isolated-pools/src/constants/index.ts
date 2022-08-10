import { Address, BigDecimal } from '@graphprotocol/graph-ts';

export const poolRegistryAddress = Address.fromString('0x0000000000000000000000000000000000000000');

import exponentToBigDecimal from '../utilities/exponentToBigDecimal';

export const zeroBigDecimal = BigDecimal.fromString('0');

export const defaultMantissaFactorBigDecimal: BigDecimal = exponentToBigDecimal(18);
