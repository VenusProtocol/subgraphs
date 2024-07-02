import timelockDeploy from '@venusprotocol/governance-contracts/dist/deploy/001-timelock';
import accessControlDeploy from '@venusprotocol/governance-contracts/dist/deploy/002-access-control';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await timelockDeploy(hre);
  await accessControlDeploy(hre);
};

export default func;
