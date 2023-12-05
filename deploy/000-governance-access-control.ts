import timelock from '@venusprotocol/governance-contracts/dist/deploy/001-timelock';
import accessControl from '@venusprotocol/governance-contracts/dist/deploy/002-access-control';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await timelock(hre);

  await accessControl(hre);
};

export default func;
