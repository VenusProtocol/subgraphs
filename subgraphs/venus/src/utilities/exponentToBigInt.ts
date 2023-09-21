/* eslint-disable prefer-const */
import { BigInt } from '@graphprotocol/graph-ts';

// Writting this as an arrow function, produces a type signature compile error
export function exponentToBigInt(decimals: i32): BigInt {
  let bd = BigInt.fromI32(1);
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigInt.fromI32(10));
  }
  return bd;
}
