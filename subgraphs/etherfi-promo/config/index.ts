#!/usr/bin/env ts-node
import ethereumILDeployments from '@venusprotocol/isolated-pools/deployments/ethereum_addresses.json';
import sepoliaILDeployments from '@venusprotocol/isolated-pools/deployments/sepolia_addresses.json';
import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = ['sepolia', 'ethereum', 'docker'] as const;
  const network = process.env.NETWORK as (typeof supportedNetworks)[number];
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
      vWeEthAddress: sepoliaILDeployments.addresses.VToken_vweETH_LiquidStakedETH,
      weEthAddress: '0x3b8b6E96e57f0d1cD366AaCf4CcC68413aF308D0',
      startBlock: '0',
    },
    sepolia: {
      network: 'sepolia',
      vWeEthAddress: sepoliaILDeployments.addresses.VToken_vweETH_LiquidStakedETH,
      weEthAddress: '0x3b8b6E96e57f0d1cD366AaCf4CcC68413aF308D0',
      startBlock: '5659827',
    },
    ethereum: {
      network: 'mainnet',
      vWeEthAddress: ethereumILDeployments.addresses.VToken_vweETH_LiquidStakedETH,
      weEthAddress: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
      startBlock: '19076099',
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
