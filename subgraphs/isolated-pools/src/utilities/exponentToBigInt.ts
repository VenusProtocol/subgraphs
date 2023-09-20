import { BigInt } from '@graphprotocol/graph-ts';

function exponentToBigInt(decimals: i32): BigInt {
  let bd = BigInt.fromString('1');
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigInt.fromString('10'));
  }
  return bd;
}

export default exponentToBigInt;
