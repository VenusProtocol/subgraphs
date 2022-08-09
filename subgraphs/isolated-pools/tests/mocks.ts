import { BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as';

import { poolRegistryAddress } from '../src/constants';

// type PoolsArray = [name: string, creator: Address, comptroller: Address, blockPosted: BigInt, timestampPosted: BigInt][];

export const createPoolRegistryMock = (pools: Array<Array<ethereum.Value>>): void => {
  pools.forEach((pool, idx): void => {
    const tupleArray: Array<ethereum.Value> = [
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(idx)),
      pool[0],
      pool[1],
      pool[2],
      pool[3],
      pool[4],
    ];
    const tuple = changetype<ethereum.Tuple>(tupleArray);
    const tupleValue = ethereum.Value.fromTuple(tuple);

    createMockedFunction(
      poolRegistryAddress,
      'getPoolByID',
      'getPoolByID(uint256):((uint256,string,address,address,uint256,uint256))',
    )
      .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(idx))])
      .returns([tupleValue]);
  });
};
