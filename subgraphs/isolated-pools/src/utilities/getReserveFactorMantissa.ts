import { BigInt } from '@graphprotocol/graph-ts';

import { CToken as CTokenContract } from '../../generated/templates/CToken/CToken';

const getReserveFactorMantissa = (vTokenContract: CTokenContract): BigInt => {
  const reserveFactor = vTokenContract.try_reserveFactorMantissa();
  return reserveFactor.reverted ? BigInt.fromI32(0) : reserveFactor.value;
};

export default getReserveFactorMantissa;
