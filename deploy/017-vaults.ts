import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const xvsDeployment = await deploy('XVS', {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });
  const xvsAddress = xvsDeployment.address;

  const xvsVaultDeployment = await deploy('XVSVault', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const xvsVaultAddress = xvsVaultDeployment.address;

  const xvsVaultProxyDeployment = await deploy('XVSVaultProxy', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const xvsVaultProxyAddress = xvsVaultProxyDeployment.address;

  await deploy('XVSStore', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  let xvsVault = await ethers.getContract('XVSVault');
  const xvsStore = await ethers.getContract('XVSStore');
  const xvsVaultProxy = await ethers.getContract('XVSVaultProxy');
  const accessControlManager = await ethers.getContract('AccessControlManager');

  // Become Implementation of XVSVaultProxy
  await xvsVaultProxy._setPendingImplementation(xvsVaultAddress);
  await xvsVault._become(xvsVaultProxyAddress);

  xvsVault = await ethers.getContractAt('XVSVault', xvsVaultProxyAddress);

  let txn = await xvsVault.setXvsStore(xvsAddress, xvsStore.address);
  await txn.wait(1);

  txn = await xvsVault.setAccessControl(accessControlManager.address);
  await txn.wait(1);

  // Set new owner to xvs store
  await xvsStore.setNewOwner(xvsVaultProxyAddress);
};

func.tags = ['XVS vault'];

export default func;
