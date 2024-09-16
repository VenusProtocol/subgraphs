import arbitrumDeployments from '@venusprotocol/isolated-pools/deployments/arbitrumone_addresses.json';
import arbitrumSepoliaDeployments from '@venusprotocol/isolated-pools/deployments/arbitrumsepolia_addresses.json';
import bscMainnetDeployments from '@venusprotocol/isolated-pools/deployments/bscmainnet_addresses.json';
import chapelDeployments from '@venusprotocol/isolated-pools/deployments/bsctestnet_addresses.json';
import ethereumDeployments from '@venusprotocol/isolated-pools/deployments/ethereum_addresses.json';
import opBnbMainnetDeployments from '@venusprotocol/isolated-pools/deployments/opbnbmainnet_addresses.json';
import sepoliaDeployments from '@venusprotocol/isolated-pools/deployments/sepolia_addresses.json';
import zksyncDeployments from '@venusprotocol/isolated-pools/deployments/zksyncmainnet_addresses.json';
import zksyncSepoliaDeployments from '@venusprotocol/isolated-pools/deployments/zksyncsepolia_addresses.json';
import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = [
    'ethereum',
    'sepolia',
    'chapel',
    'bsc',
    'docker',
    'opbnbMainnet',
    'arbitrumSepolia',
    'arbitrum',
    'zksyncSepolia',
    'zksync',
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
      poolRegistryAddress: '0xB06c856C8eaBd1d8321b687E188204C1018BC4E5',
      startBlock: 0,
    },
    ethereum: {
      network: 'mainnet',
      poolRegistryAddress: ethereumDeployments.addresses.PoolRegistry,
      startBlock: '18968000',
    },
    sepolia: {
      network: 'sepolia',
      poolRegistryAddress: sepoliaDeployments.addresses.PoolRegistry,
      startBlock: '3930059',
    },
    chapel: {
      network: 'chapel',
      poolRegistryAddress: chapelDeployments.addresses.PoolRegistry,
      startBlock: '30870000',
    },
    bsc: {
      network: 'bsc',
      poolRegistryAddress: bscMainnetDeployments.addresses.PoolRegistry,
      startBlock: '29300000',
    },
    opbnbMainnet: {
      network: 'opbnb-mainnet',
      poolRegistryAddress: opBnbMainnetDeployments.addresses.PoolRegistry,
      startBlock: '16232873',
    },
    arbitrumSepolia: {
      network: 'arbitrum-sepolia',
      poolRegistryAddress: arbitrumSepoliaDeployments.addresses.PoolRegistry,
      startBlock: '44214769',
    },
    arbitrum: {
      network: 'arbitrum-one',
      poolRegistryAddress: arbitrumDeployments.addresses.PoolRegistry,
      startBlock: '216184381',
    },
    zksyncSepolia: {
      network: 'zksync-era-sepolia',
      poolRegistryAddress: zksyncSepoliaDeployments.addresses.PoolRegistry,
      startBlock: '3535723',
    },
    zksync: {
      network: 'zksync',
      poolRegistryAddress: zksyncDeployments.addresses.PoolRegistry,
      startBlock: '3535723',
    },
  };

  Mustache.escape = function (text) {
    return text;
  };

  const yamlTemplate = fs.readFileSync('template.yaml', 'utf8');
  const yamlOutput = Mustache.render(yamlTemplate, config[network]);
  fs.writeFileSync('subgraph.yaml', yamlOutput);

  const configTemplate = fs.readFileSync('src/constants/config-template', 'utf8');
  const tsOutput = Mustache.render(configTemplate, config[network]);
  fs.writeFileSync('src/constants/config.ts', tsOutput);
};

main();
