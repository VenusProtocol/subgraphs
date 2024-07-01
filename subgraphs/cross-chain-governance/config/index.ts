#!/usr/bin/env ts-node
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
    },
    sepolia: {
      network: 'sepolia',
      layerZeroChainId: 10161,
      omnichainGovernanceOwnerAddress: '0xf964158C67439D01e5f17F0A3F39DfF46823F27A',
      startBlockOmnichainGovernanceOwner: '6049722',
      omnichainExecutorOwnerAddress: '0xD9B18a43Ee9964061c1A1925Aa907462F0249109',
      startBlockOmnichainGovernanceExecutor: '6049686',
    },
    ethereum: {
      network: 'mainnet',
      layerZeroChainId: 101,
      omnichainGovernanceOwnerAddress: '0x87Ed3Fd3a25d157637b955991fb1B41B566916Ba',
      startBlockOmnichainGovernanceOwner: '20037893',
      omnichainExecutorOwnerAddress: '0xd70ffB56E4763078b8B814C0B48938F35D83bE0C',
      startBlockOmnichainGovernanceExecutor: '20032813',
    },
    opbnbMainnet: {
      network: 'opbnb-mainnet',
      layerZeroChainId: 202,
      omnichainGovernanceOwnerAddress: '0xf7e4c81Cf4A03d52472a4d00c3d9Ef35aF127E45',
      startBlockOmnichainGovernanceOwner: '26957477',
      omnichainExecutorOwnerAddress: '0x82598878Adc43F1013A27484E61ad663c5d50A03',
      startBlockOmnichainGovernanceExecutor: '26952944',
    },
    arbitrumSepolia: {
      network: 'arbitrum-sepolia',
      layerZeroChainId: 10231,
      omnichainGovernanceOwnerAddress: '0xfCA70dd553b7dF6eB8F813CFEA6a9DD039448878',
      startBlockOmnichainGovernanceOwner: '54236728',
      omnichainExecutorOwnerAddress: '0xcf3e6972a8e9c53D33b642a2592938944956f138',
      startBlockOmnichainGovernanceExecutor: '54235048',
    },
    arbitrum: {
      network: 'arbitrum-one',
      layerZeroChainId: 110,
      omnichainGovernanceOwnerAddress: '0xf72C1Aa0A1227B4bCcB28E1B1015F0616E2db7fD',
      startBlockOmnichainGovernanceOwner: '221744426',
      omnichainExecutorOwnerAddress: '0xc1858cCE6c28295Efd3eE742795bDa316D7c7526',
      startBlockOmnichainGovernanceExecutor: '221743592',
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
