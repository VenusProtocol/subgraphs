import { Address } from '@graphprotocol/graph-ts';

import { VToken as VTokenContract } from '../../generated/templates/VToken/VToken';

const getUnderlyingAddress = (vTokenContract: VTokenContract): Address => {
  const underlyingAddress = vTokenContract.try_underlying();
  return underlyingAddress.reverted
    ? Address.fromString('0x0000000000000000000000000000000000000000')
    : underlyingAddress.value;
};

export default getUnderlyingAddress;
