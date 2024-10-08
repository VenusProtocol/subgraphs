#!/usr/bin/env ts-node
import arbitrumDeployments from '@venusprotocol/governance-contracts/deployments/arbitrumone_addresses.json';
import arbitrumSepoliaDeployments from '@venusprotocol/governance-contracts/deployments/arbitrumsepolia_addresses.json';
import ethereumDeployments from '@venusprotocol/governance-contracts/deployments/ethereum_addresses.json';
import opBnBMainnetDeployments from '@venusprotocol/governance-contracts/deployments/opbnbmainnet_addresses.json';
import sepoliaDeployments from '@venusprotocol/governance-contracts/deployments/sepolia_addresses.json';
import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = [
    'sepolia',
    'ethereum',
    'docker',
    'opbnbMainnet',
    'arbitrumSepolia',
    'arbitrum',
  ] as const;
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
      layerZeroChainId: 10102,
      omnichainGovernanceOwnerAddress: '0xd9fEc8238711935D6c8d79Bef2B9546ef23FC046',
      startBlockOmnichainGovernanceOwner: '0',
      omnichainExecutorOwnerAddress: '0xeAd789bd8Ce8b9E94F5D0FCa99F8787c7e758817',
      startBlockOmnichainGovernanceExecutor: '0',
      accessControlManagerAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      accessControlManagerStartBlock: '0',
    },
    sepolia: {
      network: 'sepolia',
      layerZeroChainId: 10161,
      omnichainGovernanceOwnerAddress: sepoliaDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '6049722',
      omnichainExecutorOwnerAddress: sepoliaDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '6049686',
      accessControlManagerAddress: sepoliaDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '4204345',
    },
    ethereum: {
      network: 'mainnet',
      layerZeroChainId: 101,
      omnichainGovernanceOwnerAddress: ethereumDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '20037893',
      omnichainExecutorOwnerAddress: ethereumDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '20032813',
      accessControlManagerAddress: ethereumDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '18641314',
    },
    opbnbMainnet: {
      network: 'opbnb-mainnet',
      layerZeroChainId: 202,
      omnichainGovernanceOwnerAddress: opBnBMainnetDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '26957477',
      omnichainExecutorOwnerAddress: opBnBMainnetDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '26952944',
      accessControlManagerAddress: opBnBMainnetDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '10895878',
    },
    arbitrumSepolia: {
      network: 'arbitrum-sepolia',
      layerZeroChainId: 10231,
      omnichainGovernanceOwnerAddress: arbitrumSepoliaDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '54236728',
      omnichainExecutorOwnerAddress:
        arbitrumSepoliaDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '54235048',
      accessControlManagerAddress: arbitrumSepoliaDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '25350320',
    },
    arbitrum: {
      network: 'arbitrum-one',
      layerZeroChainId: 110,
      omnichainGovernanceOwnerAddress: arbitrumDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '221744426',
      omnichainExecutorOwnerAddress: arbitrumDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '221743592',
      accessControlManagerAddress: arbitrumDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '201597544',
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
