import { BigInt } from '@graphprotocol/graph-ts';

import { VToken as VTokenContract } from '../../generated/templates/VToken/VToken';

const getReserveFactorMantissa = (vTokenContract: VTokenContract): BigInt => {
  const reserveFactor = vTokenContract.try_reserveFactorMantissa();
  return reserveFactor.reverted ? BigInt.fromI32(0) : reserveFactor.value;
};

export default getReserveFactorMantissa;
