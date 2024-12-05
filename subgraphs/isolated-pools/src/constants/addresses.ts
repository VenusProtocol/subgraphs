import { Address } from '@graphprotocol/graph-ts';

import {
  poolRegistryAddress as poolRegistryAddressString,
  vBifiAddress as vBifiAddressString,
  vLisUsdAddress as vLisUsdAddressString,
  vagEURAddress as vagEURAddressString,
  vankrBNBLiquidStakedBNBAddress as vankrBNBLiquidStakedBNBAddressString,
  vankrBNBDeFiAddress as vankrBNBDeFiAddressString,
  vSnBNBAddress as vSnBNBAddressString,
  vWETHLiquidStakedETHAddress as vWETHLiquidStakedETHAddressString,
  vWETHCoreAddress as vWETHCoreAddressString,
} from './config';

export const poolRegistryAddress = Address.fromString(poolRegistryAddressString);
const nullAddressString = '0x0000000000000000000000000000000000000000';
export const nullAddress = Address.fromString(nullAddressString);

export const vBifiAddress = Address.fromString(
  vBifiAddressString.length > 0 ? vBifiAddressString : nullAddressString,
);
export const vLisUsdAddress = Address.fromString(
  vLisUsdAddressString.length > 0 ? vLisUsdAddressString : nullAddressString,
);
export const vagEURAddress = Address.fromString(
  vagEURAddressString.length > 0 ? vagEURAddressString : nullAddressString,
);
export const vankrBNBLiquidStakedBNBAddress = Address.fromString(
  vankrBNBLiquidStakedBNBAddressString.length > 0
    ? vankrBNBLiquidStakedBNBAddressString
    : nullAddressString,
);
export const vankrBNBDeFiAddress = Address.fromString(
  vankrBNBDeFiAddressString.length > 0 ? vankrBNBDeFiAddressString : nullAddressString,
);
export const vSnBNBAddress = Address.fromString(
  vSnBNBAddressString.length > 0 ? vSnBNBAddressString : nullAddressString,
);
export const vWETHLiquidStakedETHAddress = Address.fromString(
  vWETHLiquidStakedETHAddressString.length > 0
    ? vWETHLiquidStakedETHAddressString
    : nullAddressString,
);
export const vWETHCoreAddress = Address.fromString(
  vWETHCoreAddressString.length > 0 ? vWETHCoreAddressString : nullAddressString,
);
