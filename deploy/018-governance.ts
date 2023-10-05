import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const timelock = await ethers.getContract('Timelock');
  const xvsVault = await ethers.getContract('XVSVault');

  await deploy('GovernorAlpha', {
    from: deployer,
    args: [timelock.address, xvsVault.address, deployer],
    log: true,
    autoMine: true,
  });

  await deploy('GovernorAlpha2', {
    from: deployer,
    args: [timelock.address, xvsVault.address, deployer, 20],
    log: true,
    autoMine: true,
  });

  const governorBravoDelegateDeployment = await deploy('GovernorBravoDelegate', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const governorBravoDelegate = await ethers.getContractAt(
    'GovernorBravoDelegate',
    governorBravoDelegateDeployment.address,
  );
  const minVotingDelay = await governorBravoDelegate.MIN_VOTING_DELAY();
  const minVotingPeriod = await governorBravoDelegate.MIN_VOTING_PERIOD();
  const minProposalThreshold = await governorBravoDelegate.MIN_PROPOSAL_THRESHOLD();
  const proposalConfigs = [
    {
      votingDelay: minVotingDelay.add(3),
      votingPeriod: minVotingPeriod.add(3),
      proposalThreshold: minProposalThreshold.add(3),
    },
    {
      votingDelay: minVotingDelay.add(2),
      votingPeriod: minVotingPeriod.add(2),
      proposalThreshold: minProposalThreshold.add(2),
    },
    {
      votingDelay: minVotingDelay.add(1),
      votingPeriod: minVotingPeriod.add(1),
      proposalThreshold: minProposalThreshold.add(1),
    },
  ];

  const timelocks = [timelock.address, timelock.address, timelock.address];

  await deploy('GovernorBravoDelegator', {
    from: deployer,
    args: [
      xvsVault.address,
      deployer,
      governorBravoDelegate.address,
      proposalConfigs,
      timelocks,
      deployer,
    ],
    log: true,
    autoMine: true,
  });
};

func.tags = ['Governance'];

export default func;
