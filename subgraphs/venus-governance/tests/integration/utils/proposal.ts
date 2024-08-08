import { ethers } from 'hardhat';

export const makePayload = async (
  targets: string[],
  values: number[],
  signatures: string[],
  calldatas: string[],
  proposalType: number,
) => {
  const payload = ethers.utils.defaultAbiCoder.encode(
    ['address[]', 'uint256[]', 'string[]', 'bytes[]', 'uint8'],
    [targets, values, signatures, calldatas, proposalType],
  );
  return payload;
};
