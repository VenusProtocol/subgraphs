import { mine } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;
  const signers = await ethers.getSigners();
  const { deployer } = await getNamedAccounts();

  const omnichainProposalSender = await ethers.getContract('OmnichainProposalSender');

  const accessControlManager = await ethers.getContract('AccessControlManager');
  const omnichainExecutorOwner = await ethers.getContract('OmnichainExecutorOwner');
  const normalTimeLock = await ethers.getContract('NormalTimelock');

  await accessControlManager.giveCallPermission(
    ethers.constants.AddressZero,
    'execute(uint16,bytes,bytes,address)',
    deployer,
  );
  await accessControlManager.giveCallPermission(
    ethers.constants.AddressZero,
    'execute(uint16,bytes,bytes,address)',
    normalTimeLock.address,
  );
  await accessControlManager.giveCallPermission(
    ethers.constants.AddressZero,
    'setTrustedRemoteAddress(uint16,bytes)',
    deployer,
  );

  await omnichainProposalSender.setTrustedRemoteAddress(10102, omnichainExecutorOwner.address);

  let currentBlockTimestamp = +(await ethers.provider.getBlock('latest')).timestamp;
  const delay = currentBlockTimestamp + +((await normalTimeLock.delay()) + 1);
  await accessControlManager.giveCallPermission(
    ethers.constants.AddressZero,
    'setMaxDailyReceiveLimit(uint256)',
    normalTimeLock.address,
  );

  await accessControlManager.giveCallPermission(
    ethers.constants.AddressZero,
    'setMaxDailyLimit(uint16,uint256)',
    deployer,
  );

  await normalTimeLock
    .connect(signers[0])
    .queueTransaction(
      omnichainExecutorOwner.address,
      0,
      'setMaxDailyReceiveLimit(uint256)',
      ethers.utils.defaultAbiCoder.encode(['uint256'], [100]),
      delay,
    );

  while (delay > currentBlockTimestamp) {
    await mine(1);
    currentBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
  }

  await normalTimeLock
    .connect(signers[0])
    .executeTransaction(
      omnichainExecutorOwner.address,
      0,
      'setMaxDailyReceiveLimit(uint256)',
      ethers.utils.defaultAbiCoder.encode(['uint256'], [100]),
      delay,
    );

  await omnichainProposalSender.setMaxDailyLimit(10102, 100);
};

export default func;
