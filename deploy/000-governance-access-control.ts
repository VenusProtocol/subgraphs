import accessControl from '@venusprotocol/governance-contracts/dist/deploy/001-access-control';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy('Timelock', {
    from: deployer,
    args: [deployer, 3600],
    log: true,
    autoMine: true,
  });

  await accessControl(hre);
};

export default func;
