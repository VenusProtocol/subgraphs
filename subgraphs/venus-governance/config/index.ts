import bscMainnetGovernanceDeployments from '@venusprotocol/governance-contracts/deployments/bscmainnet_addresses.json';
import bscTestnetGovernanceDeployments from '@venusprotocol/governance-contracts/deployments/bsctestnet_addresses.json';
import bscMainnetCoreDeployments from '@venusprotocol/venus-protocol/deployments/bscmainnet_addresses.json';
import bscTestnetCoreDeployments from '@venusprotocol/venus-protocol/deployments/bsctestnet_addresses.json';
import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = ['chapel', 'bsc', 'docker'] as const;
  const network = process.env.NETWORK;
  // @ts-expect-error network env var is unknown here
  if (!supportedNetworks.includes(network)) {
    throw new Error(`NETWORK env var must be set to one of ${supportedNetworks}`);
  }
  return network as (typeof supportedNetworks)[number];
};

const main = () => {
  const network = getNetwork();
  const config = {
    docker: {
      network: 'hardhat',
      accessControlManagerAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      accessControlManagerStartBlock: '0',
      governorAlphaAddress: '0xb185E9f6531BA9877741022C92CE858cDCc5760E',
      governorAlphaStartBlock: '0',
      governorAlpha2Address: '0x01E21d7B8c39dc4C764c19b308Bd8b14B1ba139E',
      governorAlpha2StartBlock: '0',
      governorBravoDelegatorAddress: '0x7C8BaafA542c57fF9B2B90612bf8aB9E86e22C09',
      governorBravoDelegatorStartBlock: '0',
      xvsTokenAddress: '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF',
      xvsTokenStartBlock: '0',
      xvsVaultAddress: '0x9d4454B023096f34B160D6B654540c56A1F81688',
      xvsVaultStartBlock: '0',
      xvsVaultPid: '0',
      omnichainProposalSenderAddress: '0x0a17FabeA4633ce714F1Fa4a2dcA62C3bAc4758d',
      omnichainProposalSenderStartBlock: '0',
    },
    chapel: {
      network: 'chapel',
      accessControlManagerAddress: bscTestnetGovernanceDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '24711629',
      governorAlphaAddress: bscTestnetGovernanceDeployments.addresses.GovernorAlpha,
      governorAlphaStartBlock: '8205736',
      governorAlpha2Address: '0x7116894ed34FC4B27D5b84f46B70Af48397a6C24',
      governorAlpha2StartBlock: '13584539',
      governorBravoDelegatorAddress:
        bscTestnetGovernanceDeployments.addresses.GovernorBravoDelegator,
      governorBravoDelegatorStartBlock: '16002994 ',
      xvsTokenAddress: bscTestnetCoreDeployments.addresses.XVS,
      xvsTokenStartBlock: '2802593',
      xvsVaultAddress: bscTestnetCoreDeployments.addresses.XVSVaultProxy,
      xvsVaultStartBlock: '13937802',
      xvsVaultPid: '1',
      omnichainProposalSenderAddress:
        bscTestnetGovernanceDeployments.addresses.OmnichainProposalSender,
      omnichainProposalSenderStartBlock: '40979674',
    },
    bsc: {
      network: 'bsc',
      accessControlManagerAddress: bscMainnetGovernanceDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '21968138',
      governorAlphaAddress: bscMainnetGovernanceDeployments.addresses.GovernorAlpha,
      governorAlphaStartBlock: '2474351',
      governorAlpha2Address: bscMainnetGovernanceDeployments.addresses.GovernorAlpha2,
      governorAlpha2StartBlock: '11934064',
      governorBravoDelegatorAddress:
        bscMainnetGovernanceDeployments.addresses.GovernorBravoDelegator,
      governorBravoDelegatorStartBlock: '13729317',
      xvsTokenAddress: bscMainnetCoreDeployments.addresses.XVS,
      xvsTokenStartBlock: '858561',
      xvsVaultAddress: bscMainnetCoreDeployments.addresses.XVSVaultProxy,
      xvsVaultStartBlock: '13018718',
      xvsVaultPid: '0',
      omnichainProposalSenderAddress: '0x36a69dE601381be7b0DcAc5D5dD058825505F8f6',
      omnichainProposalSenderStartBlock: '39375361',
    },
  };

  const yamlTemplate = fs.readFileSync('template.yaml', 'utf8');
  const yamlOutput = Mustache.render(yamlTemplate, config[network]);
  fs.writeFileSync('subgraph.yaml', yamlOutput);

  const configTemplate = fs.readFileSync('src/constants/config-template', 'utf8');
  const tsOutput = Mustache.render(configTemplate, config[network]);
  fs.writeFileSync('src/constants/config.ts', tsOutput);
};

main();
