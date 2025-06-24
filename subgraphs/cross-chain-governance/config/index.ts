#!/usr/bin/env ts-node
import arbitrumDeployments from '@venusprotocol/governance-contracts/deployments/arbitrumone_addresses.json';
import arbitrumSepoliaDeployments from '@venusprotocol/governance-contracts/deployments/arbitrumsepolia_addresses.json';
import ethereumDeployments from '@venusprotocol/governance-contracts/deployments/ethereum_addresses.json';
import opBnBMainnetDeployments from '@venusprotocol/governance-contracts/deployments/opbnbmainnet_addresses.json';
import optimismDeployments from '@venusprotocol/governance-contracts/deployments/opmainnet_addresses.json';
import optimismSepoliaDeployments from '@venusprotocol/governance-contracts/deployments/opsepolia_addresses.json';
import sepoliaDeployments from '@venusprotocol/governance-contracts/deployments/sepolia_addresses.json';
import zkSyncDeployments from '@venusprotocol/governance-contracts/deployments/zksyncmainnet_addresses.json';
import zkSyncSepoliaDeployments from '@venusprotocol/governance-contracts/deployments/zksyncsepolia_addresses.json';
import baseSepoliaDeployments from '@venusprotocol/governance-contracts/deployments/basesepolia_addresses.json';
import baseMainnetDeployments from '@venusprotocol/governance-contracts/deployments/basemainnet_addresses.json';
import unichainSepoliaDeployments from '@venusprotocol/governance-contracts/deployments/unichainsepolia_addresses.json';
import unichainMainnetDeployments from '@venusprotocol/governance-contracts/deployments/unichainmainnet_addresses.json';
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
    'zkSyncSepolia',
    'zkSync',
    'optimismSepolia',
    'optimism',
    'baseSepolia',
    'base',
    'unichainSepolia',
    'unichain',
    'berachainBepolia',
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
      omnichainGovernanceExecutorAddress: '0xeAd789bd8Ce8b9E94F5D0FCa99F8787c7e758817',
      startBlockOmnichainGovernanceExecutor: '0',
      accessControlManagerAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      accessControlManagerStartBlock: '0',
    },
    sepolia: {
      network: 'sepolia',
      layerZeroChainId: 10161,
      omnichainGovernanceOwnerAddress: sepoliaDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '6049722',
      omnichainGovernanceExecutorAddress: sepoliaDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '6049686',
      accessControlManagerAddress: sepoliaDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '4204345',
    },
    ethereum: {
      network: 'mainnet',
      layerZeroChainId: 101,
      omnichainGovernanceOwnerAddress: ethereumDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '20037893',
      omnichainGovernanceExecutorAddress: ethereumDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '20032813',
      accessControlManagerAddress: ethereumDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '18641314',
    },
    opbnbMainnet: {
      network: 'opbnb-mainnet',
      layerZeroChainId: 202,
      omnichainGovernanceOwnerAddress: opBnBMainnetDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '26957477',
      omnichainGovernanceExecutorAddress:
        opBnBMainnetDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '26952944',
      accessControlManagerAddress: opBnBMainnetDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '10895878',
    },
    arbitrumSepolia: {
      network: 'arbitrum-sepolia',
      layerZeroChainId: 10231,
      omnichainGovernanceOwnerAddress: arbitrumSepoliaDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '54236728',
      omnichainGovernanceExecutorAddress:
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
      omnichainGovernanceExecutorAddress: arbitrumDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '221743592',
      accessControlManagerAddress: arbitrumDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '201597544',
    },
    zkSyncSepolia: {
      network: 'zksync-era-sepolia',
      layerZeroChainId: 10248,
      omnichainGovernanceOwnerAddress: zkSyncSepoliaDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '3771652',
      omnichainGovernanceExecutorAddress:
        zkSyncSepoliaDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '3771603',
      accessControlManagerAddress: zkSyncSepoliaDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '3445364',
    },
    zkSync: {
      network: 'zksync-era',
      layerZeroChainId: 165,
      omnichainGovernanceOwnerAddress: zkSyncDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '48278537',
      omnichainGovernanceExecutorAddress: zkSyncDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '48277850',
      accessControlManagerAddress: zkSyncDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '42301361',
    },
    optimismSepolia: {
      network: 'optimism-sepolia',
      layerZeroChainId: 10232,
      omnichainGovernanceOwnerAddress: optimismSepoliaDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '18679072',
      omnichainGovernanceExecutorAddress:
        optimismSepoliaDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '18676643',
      accessControlManagerAddress: optimismSepoliaDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '14150248',
    },
    optimism: {
      network: 'optimism',
      layerZeroChainId: 111,
      omnichainGovernanceOwnerAddress: optimismDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '127723947',
      omnichainGovernanceExecutorAddress: optimismDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '127723676',
      accessControlManagerAddress: optimismDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '125490536',
    },
    baseSepolia: {
      network: 'base-sepolia',
      layerZeroChainId: 10245,
      omnichainGovernanceOwnerAddress: baseSepoliaDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '18475319',
      omnichainGovernanceExecutorAddress:
        baseSepoliaDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '18470846',
      accessControlManagerAddress: baseSepoliaDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '16737038',
    },
    base: {
      network: 'base',
      layerZeroChainId: 184,
      omnichainGovernanceOwnerAddress: baseMainnetDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '23531514',
      omnichainGovernanceExecutorAddress:
        baseMainnetDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '23531230',
      accessControlManagerAddress: baseMainnetDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '23212000',
    },
    unichainSepolia: {
      network: 'unichain-sepolia',
      layerZeroChainId: 10333,
      omnichainGovernanceOwnerAddress: unichainSepoliaDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '12506108',
      omnichainGovernanceExecutorAddress:
        unichainSepoliaDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '12504577',
      accessControlManagerAddress: unichainSepoliaDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '3358050',
    },
    unichain: {
      network: 'unichain',
      layerZeroChainId: 320,
      omnichainGovernanceOwnerAddress: unichainMainnetDeployments.addresses.OmnichainExecutorOwner,
      startBlockOmnichainGovernanceOwner: '9143903 ',
      omnichainGovernanceExecutorAddress:
        unichainMainnetDeployments.addresses.OmnichainGovernanceExecutor,
      startBlockOmnichainGovernanceExecutor: '9143169 ',
      accessControlManagerAddress: unichainMainnetDeployments.addresses.AccessControlManager,
      accessControlManagerStartBlock: '8095093',
    },
    // replace with package entries once it's published
    berachainBepolia: {
      network: 'berachain-bepolia',
      layerZeroChainId: 10371,
      omnichainGovernanceOwnerAddress: '0x61ed025c4EB50604F367316B8E18dB7eb7283D49',
      startBlockOmnichainGovernanceOwner: '2922366',
      omnichainGovernanceExecutorAddress: '0xc80E4112940efF40c8626bAc0D8E79cB7dAbe289',
      startBlockOmnichainGovernanceExecutor: '2922254',
      accessControlManagerAddress: '0x243313C1cC198FF80756ed2ef14D9dcd94Ee762b',
      accessControlManagerStartBlock: '2922351',
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
