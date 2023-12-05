import { ethers, network } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const signers = await ethers.getSigners();

  const timelock = await ethers.getContract('CriticalTimelock');
  const xvsVault = await ethers.getContract('XVSVaultProxy');

  const governorAlphaTimelock = await ethers.getContract('CriticalTimelock');
  await deploy('GovernorAlpha', {
    from: deployer,
    args: [governorAlphaTimelock.address, xvsVault.address, deployer],
    log: true,
    autoMine: true,
  });
  const governorAlpha = await ethers.getContract('GovernorAlpha');

  await signers[0].sendTransaction({
    to: governorAlphaTimelock.address,
    value: ethers.utils.parseEther('1.0'),
  });

  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [governorAlphaTimelock.address],
  });
  const signer = await ethers.getSigner(governorAlphaTimelock.address);

  await governorAlphaTimelock.connect(signer).setPendingAdmin(governorAlpha.address);
  await network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [governorAlphaTimelock.address],
  });

  await governorAlpha.__acceptAdmin();

  const governorAlpha2Timelock = await ethers.getContract('CriticalTimelock');

  await deploy('GovernorAlpha2', {
    from: deployer,
    args: [governorAlpha2Timelock.address, xvsVault.address, deployer, 20],
    log: true,
    autoMine: true,
  });

  const governorAlpha2 = await ethers.getContract('GovernorAlpha2');

  await signers[0].sendTransaction({
    to: governorAlpha2Timelock.address,
    value: ethers.utils.parseEther('1.0'),
  });

  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [governorAlpha2Timelock.address],
  });
  const governorAlpha2Signer = await ethers.getSigner(governorAlpha2Timelock.address);

  await governorAlpha2Timelock
    .connect(governorAlpha2Signer)
    .setPendingAdmin(governorAlpha2.address);

  await network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [governorAlpha2Timelock.address],
  });

  await governorAlpha2.__acceptAdmin();

  const governorBravoDelegateV1Deployment = await deploy('GovernorBravoDelegateV1', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deploy('GovernorBravoDelegateV2', {
    contract:
      '@venusprotocol/governance-contracts/contracts/Governance/GovernorBravoDelegate.sol:GovernorBravoDelegate',
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const governorBravoDelegate = await ethers.getContract('GovernorBravoDelegateV2');

  const minVotingDelay = await governorBravoDelegate.MIN_VOTING_DELAY();
  const minVotingPeriod = await governorBravoDelegate.MIN_VOTING_PERIOD();
  const minProposalThreshold = await governorBravoDelegate.MIN_PROPOSAL_THRESHOLD();

  await deploy('GovernorBravoDelegatorV1', {
    from: deployer,
    args: [
      timelock.address,
      xvsVault.address,
      deployer,
      governorBravoDelegateV1Deployment.address,
      minVotingPeriod.toString(),
      minVotingDelay.toString(),
      minProposalThreshold.toString(),
      deployer,
    ],
    log: true,
    autoMine: true,
  });

  await deploy('GovernorBravoDelegate', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

func.tags = ['Governance'];

export default func;
