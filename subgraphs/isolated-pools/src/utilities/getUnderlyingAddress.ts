import { Address } from '@graphprotocol/graph-ts';

import { CToken as CTokenContract } from '../../generated/templates/CToken/CToken';

const getUnderlyingAddress = (cTokenContract: CTokenContract): Address => {
  const underlyingAddress = cTokenContract.try_underlying();
  return underlyingAddress.reverted
    ? Address.fromString('0x0000000000000000000000000000000000000000')
    : underlyingAddress.value;
};

export default getUnderlyingAddress;
