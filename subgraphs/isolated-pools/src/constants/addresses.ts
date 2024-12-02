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

export const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');

export const vBifiAddress = Address.fromString(vBifiAddressString);
export const vLisUsdAddress = Address.fromString(vLisUsdAddressString);
export const vagEURAddress = Address.fromString(vagEURAddressString);
export const vankrBNBLiquidStakedBNBAddress = Address.fromString(
  vankrBNBLiquidStakedBNBAddressString,
);
export const vankrBNBDeFiAddress = Address.fromString(vankrBNBDeFiAddressString);
export const vSnBNBAddress = Address.fromString(vSnBNBAddressString);
export const vWETHLiquidStakedETHAddress = Address.fromString(vWETHLiquidStakedETHAddressString);
export const vWETHCoreAddress = Address.fromString(vWETHCoreAddressString);
