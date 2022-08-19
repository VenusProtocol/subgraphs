import { Address } from '@graphprotocol/graph-ts';

import { VToken as VTokenContract } from '../../generated/templates/VToken/VToken';

const getInterestRateModelAddress = (vTokenContract: VTokenContract): Address => {
  const interestRateModelAddress = vTokenContract.try_interestRateModel();
  return interestRateModelAddress.reverted
    ? Address.fromString('0x0000000000000000000000000000000000000000')
    : interestRateModelAddress.value;
};

export default getInterestRateModelAddress;
