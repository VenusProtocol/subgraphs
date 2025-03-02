import { Address } from '@graphprotocol/graph-ts';

import {
  poolRegistryAddress as poolRegistryAddressString,
  vBifiAddress as vBifiAddressString,
  vHAYAddress as vHAYAddressString,
  vEURAAddress as vEURAAddressString,
  vankrBNBLiquidStakedBNBAddress as vankrBNBLiquidStakedBNBAddressString,
  vankrBNBDeFiAddress as vankrBNBDeFiAddressString,
  vslisBNBAddress as vslisBNBAddressString,
  vWETHLiquidStakedETHAddress as vWETHLiquidStakedETHAddressString,
  vWETHCoreAddress as vWETHCoreAddressString,
} from './config';

export const poolRegistryAddress = Address.fromString(poolRegistryAddressString);
const nullAddressString = '0x0000000000000000000000000000000000000000';
export const nullAddress = Address.fromString(nullAddressString);

export const vBifiAddress = Address.fromString(
  vBifiAddressString.length > 0 ? vBifiAddressString : nullAddressString,
);
export const vHAYAddress = Address.fromString(
  vHAYAddressString.length > 0 ? vHAYAddressString : nullAddressString,
);
export const vEURAAddress = Address.fromString(
  vEURAAddressString.length > 0 ? vEURAAddressString : nullAddressString,
);
export const vankrBNBLiquidStakedBNBAddress = Address.fromString(
  vankrBNBLiquidStakedBNBAddressString.length > 0
    ? vankrBNBLiquidStakedBNBAddressString
    : nullAddressString,
);
export const vankrBNBDeFiAddress = Address.fromString(
  vankrBNBDeFiAddressString.length > 0 ? vankrBNBDeFiAddressString : nullAddressString,
);
export const vslisBNBAddress = Address.fromString(
  vslisBNBAddressString.length > 0 ? vslisBNBAddressString : nullAddressString,
);
export const vWETHLiquidStakedETHAddress = Address.fromString(
  vWETHLiquidStakedETHAddressString.length > 0
    ? vWETHLiquidStakedETHAddressString
    : nullAddressString,
);
export const vWETHCoreAddress = Address.fromString(
  vWETHCoreAddressString.length > 0 ? vWETHCoreAddressString : nullAddressString,
);
