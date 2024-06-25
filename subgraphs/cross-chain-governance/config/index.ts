#!/usr/bin/env ts-node
import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = ['sepolia', 'ethereum', 'docker'] as const;
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
      layerZeroChainId: 161,
      omnichainGovernanceOwnerAddress: '0xd9fEc8238711935D6c8d79Bef2B9546ef23FC046',
      startBlockOmnichainGovernanceOwner: '0',
      omnichainExecutorOwnerAddress: '0xeAd789bd8Ce8b9E94F5D0FCa99F8787c7e758817',
      startBlockOmnichainGovernanceExecutor: '0',
    },
    sepolia: {
      network: 'sepolia',
      layerZeroChainId: 161,
      omnichainGovernanceOwnerAddress: '',
      startBlockOmnichainGovernanceOwner: '',
      omnichainGovernanceExecutorAddress: '',
      startBlockOmnichainGovernanceExecutor: '',
    },
    ethereum: {
      network: 'ethereum',
      layerZeroChainId: 101,
      omnichainGovernanceOwnerAddress: '',
      startBlockOmnichainGovernanceOwner: '',
      omnichainGovernanceExecutorAddress: '',
      startBlockOmnichainGovernanceExecutor: '',
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
