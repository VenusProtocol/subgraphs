import { BigNumberish } from 'ethers';
import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { LZ_ENDPOINTS } from '../subgraphs/cross-chain-governance/src/constants';
import { OmnichainProposalSender } from '../typechain';

export const OmnichainProposalSenderMethods: string[] = [
  'setTrustedRemote(uint16,bytes)',
  'setTrustedRemoteAddress(uint16,bytes)',
  'updateValidChainId(uint16,bool)',
  'setMaxDailyLimit(uint16,uint256)',
  'execute(uint16,bytes,bytes)',
  'pause()',
  'unpause()',
  'setSendVersion(uint16)',
  'setConfig(uint16,uint16,uint256,bytes)',
];

export const OmnichainGovernanceExecutorMethods: string[] = [
  'setSendVersion(uint16)',
  'setReceiveVersion(uint16)',
  'forceResumeReceive(uint16,bytes)',
  'setOracle(address)',
  'setMaxDailyReceiveLimit(uint16,uint256)',
  'pause()',
  'unpause()',
  'setTrustedRemote(uint16,bytes)',
  'setTrustedRemoteAddress(uint16,bytes)',
  'setPrecrime(address)',
  'setMinDstGas(uint16,uint16,uint256)',
  'setPayloadSizeLimit(uint16,uint256)',
  'setConfig(uint16,uint16,uint256,bytes)',
  'addTimelocks(ITimelock[])',
];

export const bridgeConfig = {
  bsctestnet: {
    methods: [
      { method: 'setMaxDailyLimit(uint16,uint256)', args: [10161, 100] },
      { method: 'updateValidChainId(uint16,bool)', args: [10161, true] },
    ],
  },
  bscmainnet: {
    methods: [
      { method: 'setMaxDailyLimit(uint16,uint256)', args: [101, 100] },
      { method: 'updateValidChainId(uint16,bool)', args: [101, true] },
    ],
  },
  sepolia: {
    methods: [
      { method: 'setMinDstGas(uint16,uint16,uint256)', args: [10102, 0, 200000] },
      { method: 'setMaxDailyReceiveLimit(uint16,uint256)', args: [10102, 100] },
    ],
  },
  hardhat: {
    methods: [
      { method: 'setMinDstGas(uint16,uint16,uint256)', args: [10102, 0, 200000] },
      { method: 'setMaxDailyReceiveLimit(uint16,uint256)', args: [10102, 100] },
    ],
  },
};

export const getArgTypesFromSignature = (methodSignature: string): string[] => {
  const [, argumentString] = methodSignature.split('(')[1].split(')');
  return argumentString.split(',').map(arg => arg.trim());
};

interface GovernanceCommand {
  contract: string;
  signature: string;
  argTypes: string[];
  parameters: any[];
  value: BigNumberish;
}

const configureBridgeCommands = async (
  target: string,
  hre: HardhatRuntimeEnvironment,
): Promise<GovernanceCommand[]> => {
  const commands = await Promise.all(
    bridgeConfig[hre.network.name].methods.map(async (entry: { method: string; args: any[] }) => {
      const { method, args } = entry;
      return {
        contract: target,
        signature: method,
        argTypes: getArgTypesFromSignature(method),
        parameters: args,
        value: 0,
      };
    }),
  );
  return commands.flat();
};

const configureAccessControls = async (
  methods: string[],
  accessControlManagerAddress: string,
  caller: string,
  target: string,
): Promise<GovernanceCommand[]> => {
  const commands = await Promise.all(
    methods.map(async method => {
      const callerAddress = caller;
      const targetAddress = target;
      return [
        {
          contract: accessControlManagerAddress,
          signature: 'giveCallPermission(address,string,address)',
          argTypes: ['address', 'string', 'address'],
          parameters: [targetAddress, method, callerAddress],
          value: 0,
        },
      ];
    }),
  );
  return commands.flat();
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const acmAddress = (await ethers.getContract('AccessControlManager')).address;
  const normalTimelockAddress = (await ethers.getContract('NormalTimelock')).address;
  const fastTrackTimelockAddress = (await ethers.getContract('FastTrackTimelock')).address;
  const criticalTimelockAddress = (await ethers.getContract('CriticalTimelock')).address;
  const governorBravoDelegatorAddress = (await ethers.getContract('GovernorBravoDelegator'))
    .address;

  const OmnichainProposalSender = await deploy('OmnichainProposalSender', {
    from: deployer,
    args: [
      LZ_ENDPOINTS[hre.network.name as keyof typeof LZ_ENDPOINTS],
      acmAddress,
      governorBravoDelegatorAddress,
    ],
    log: true,
    autoMine: true,
  });

  const bridge = await ethers.getContractAt<OmnichainProposalSender>(
    'OmnichainProposalSender',
    OmnichainProposalSender.address,
    ethers.provider.getSigner(deployer),
  );

  if ((await bridge.owner()) === deployer) {
    const tx = await bridge.transferOwnership(normalTimelockAddress);
    await tx.wait();
    console.log(`Bridge owner ${deployer} successfully changed to ${normalTimelockAddress}.`);
  }
  const commands = [
    ...(await configureAccessControls(
      OmnichainProposalSenderMethods,
      acmAddress,
      normalTimelockAddress,
      OmnichainProposalSender.address,
    )),
    ...(await configureAccessControls(
      OmnichainProposalSenderMethods,
      acmAddress,
      fastTrackTimelockAddress,
      OmnichainProposalSender.address,
    )),
    ...(await configureAccessControls(
      OmnichainProposalSenderMethods,
      acmAddress,
      criticalTimelockAddress,
      OmnichainProposalSender.address,
    )),
    ...(await configureBridgeCommands(OmnichainProposalSender.address, hre)),

    {
      contract: OmnichainProposalSender.address,
      signature: 'setTrustedRemote(uint16,bytes)',
      parameters: ['dstChainId', '0xDestAddressSrcAddress'],
      value: 0,
    },
  ];
  console.log('Please propose a VIP with the following commands:');
  console.log(
    JSON.stringify(
      commands.map(c => ({
        target: c.contract,
        signature: c.signature,
        params: c.parameters,
        value: c.value,
      })),
    ),
  );
};
func.tags = ['OmnichainProposalSender', 'omnichainlocal'];

export default func;
