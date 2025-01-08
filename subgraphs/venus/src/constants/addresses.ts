import { Address } from '@graphprotocol/graph-ts';

import {
  comptrollerAddress as comptrollerAddressString,
  wbETHAddress as wbETHAddressString,
  vTRXAddress as vTRXAddressString,
  vTUSDOldAddress as vTUSDOldAddressString,
} from './config';

export const comptrollerAddress = Address.fromString(comptrollerAddressString);

export const nullAddressString = '0x0000000000000000000000000000000000000000';
export const nullAddress = Address.fromString(nullAddressString);

export const nativeAddress = Address.fromString('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');

export const wbETHAddress = Address.fromString(
  wbETHAddressString.length > 0 ? wbETHAddressString : nullAddressString,
);

export const vTRXAddressAddress = Address.fromString(
  vTRXAddressString.length > 0 ? vTRXAddressString : nullAddressString,
);

export const vTUSDOldAddress = Address.fromString(
  vTUSDOldAddressString.length > 0 ? vTUSDOldAddressString : nullAddressString,
);
