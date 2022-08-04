import { PoolRegistry } from '../../generated/schema';

const getPoolRegistry = (): PoolRegistry => {
  let poolRegistry = PoolRegistry.load('1');
  if (poolRegistry == null) {
    poolRegistry = new PoolRegistry('1');
  }
  return poolRegistry;
};

export default getPoolRegistry;
