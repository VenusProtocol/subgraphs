import omnichainSource from '@venusprotocol/governance-contracts/dist/deploy/003-omnichain-source';
import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await omnichainSource(hre);

  const accessControlManager = await ethers.getContract('AccessControlManager');
  const [root] = await ethers.getSigners();
  await accessControlManager.giveCallPermission(ethers.constants.AddressZero, 'setTrustedRemoteAddress(uint16,bytes)', root.address);
};

export default func;
