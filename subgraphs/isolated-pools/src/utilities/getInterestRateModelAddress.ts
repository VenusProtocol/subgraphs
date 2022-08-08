import { Address } from '@graphprotocol/graph-ts';

import { CToken as CTokenContract } from '../../generated/templates/CToken/CToken';

const getInterestRateModelAddress = (cTokenContract: CTokenContract): Address => {
  const interestRateModelAddress = cTokenContract.try_interestRateModel();
  return interestRateModelAddress.reverted
    ? Address.fromString('0x0000000000000000000000000000000000000000')
    : interestRateModelAddress.value;
};

export default getInterestRateModelAddress;
