import arbitrumDeployments from '@venusprotocol/isolated-pools/deployments/arbitrumone_addresses.json';
import arbitrumSepoliaDeployments from '@venusprotocol/isolated-pools/deployments/arbitrumsepolia_addresses.json';
import bscMainnetDeployments from '@venusprotocol/isolated-pools/deployments/bscmainnet_addresses.json';
import chapelDeployments from '@venusprotocol/isolated-pools/deployments/bsctestnet_addresses.json';
import ethereumDeployments from '@venusprotocol/isolated-pools/deployments/ethereum_addresses.json';
import opBnbMainnetDeployments from '@venusprotocol/isolated-pools/deployments/opbnbmainnet_addresses.json';
import optimismDeployments from '@venusprotocol/isolated-pools/deployments/opmainnet_addresses.json';
import optimismSepoliaDeployments from '@venusprotocol/isolated-pools/deployments/opsepolia_addresses.json';
import sepoliaDeployments from '@venusprotocol/isolated-pools/deployments/sepolia_addresses.json';
import zksyncDeployments from '@venusprotocol/isolated-pools/deployments/zksyncmainnet_addresses.json';
import zksyncSepoliaDeployments from '@venusprotocol/isolated-pools/deployments/zksyncsepolia_addresses.json';
import baseSepoliaDeployments from '@venusprotocol/isolated-pools/deployments/basesepolia_addresses.json';
import baseMainnetDeployments from '@venusprotocol/isolated-pools/deployments/basemainnet_addresses.json';
import unichainSepoliaDeployments from '@venusprotocol/isolated-pools/deployments/unichainsepolia_addresses.json';
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
    'optimismSepolia',
    'optimism',
    'baseSepolia',
    'base',
    'unichainSepolia',
    'unichain',
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
      poolRegistryAddress: '0x3155755b79aA083bd953911C92705B7aA82a18F9',
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
      vWETHLiquidStakedETHAddress: sepoliaDeployments.addresses.VToken_vWETH_LiquidStakedETH,
      vWETHCoreAddress: sepoliaDeployments.addresses.VToken_vWETH_Core,
    },
    chapel: {
      network: 'chapel',
      poolRegistryAddress: chapelDeployments.addresses.PoolRegistry,
      vBifiAddress: '0xEF949287834Be010C1A5EDd757c385FB9b644E4A',
      vHAYAddress: chapelDeployments.addresses.VToken_vHAY_Stablecoins,
      vEURAAddress: chapelDeployments.addresses.VToken_vEURA_Stablecoins,
      vankrBNBLiquidStakedBNBAddress: chapelDeployments.addresses.VToken_vankrBNB_LiquidStakedBNB,
      vankrBNBDeFiAddress: chapelDeployments.addresses.VToken_vankrBNB_DeFi,
      vslisBNBAddress: chapelDeployments.addresses.VToken_vslisBNB_LiquidStakedBNB,
      startBlock: '30870000',
    },
    bsc: {
      network: 'bsc',
      poolRegistryAddress: bscMainnetDeployments.addresses.PoolRegistry,
      vBifiAddress: '0xC718c51958d3fd44f5F9580c9fFAC2F89815C909',
      vHAYAddress: bscMainnetDeployments.addresses.VToken_vHAY_Stablecoins,
      vEURAAddress: bscMainnetDeployments.addresses.VToken_vEURA_Stablecoins,
      vslisBNBAddress: bscMainnetDeployments.addresses.VToken_vslisBNB_LiquidStakedBNB,
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
      network: 'zksync-era',
      poolRegistryAddress: zksyncDeployments.addresses.PoolRegistry,
      startBlock: '43555102',
    },
    optimismSepolia: {
      network: 'optimism-sepolia',
      poolRegistryAddress: optimismSepoliaDeployments.addresses.PoolRegistry,
      startBlock: '17040271',
    },
    optimism: {
      network: 'optimism',
      poolRegistryAddress: optimismDeployments.addresses.PoolRegistry,
      startBlock: '126048098',
    },
    baseSepolia: {
      network: 'base-sepolia',
      poolRegistryAddress: baseSepoliaDeployments.addresses.PoolRegistry,
      startBlock: '18242654',
    },
    base: {
      network: 'base',
      poolRegistryAddress: baseMainnetDeployments.addresses.PoolRegistry,
      startBlock: '23344365',
    },
    unichainSepolia: {
      network: 'unichain-testnet',
      poolRegistryAddress: unichainSepoliaDeployments.addresses.PoolRegistry,
      startBlock: '4630912',
    },
    unichain: {
      network: 'unichain',
      poolRegistryAddress: '0x0C52403E16BcB8007C1e54887E1dFC1eC9765D7C',
      startBlock: '8199043',
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
