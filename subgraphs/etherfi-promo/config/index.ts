#!/usr/bin/env ts-node
import ethereumILDeployments from '@venusprotocol/isolated-pools/deployments/ethereum_addresses.json';
import sepoliaILDeployments from '@venusprotocol/isolated-pools/deployments/sepolia_addresses.json';
import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = ['sepolia', 'ethereum', 'docker', 'bsc'] as const;
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
      vWeEthsAddress: sepoliaILDeployments.addresses.VToken_vweETHs_LiquidStakedETH,
      vWeEthStartBlock: '0',
      vWeEthsStartBlock: '0',
      template: 'template.yaml',
    },
    sepolia: {
      network: 'sepolia',
      vWeEthAddress: sepoliaILDeployments.addresses.VToken_vweETH_LiquidStakedETH,
      vWeEthsAddress: sepoliaILDeployments.addresses.VToken_vweETHs_LiquidStakedETH,
      vWeEthStartBlock: '5659827',
      vWeEthsStartBlock: '6536644',
      template: 'template.yaml',
    },
    ethereum: {
      network: 'mainnet',
      vWeEthAddress: ethereumILDeployments.addresses.VToken_vweETH_LiquidStakedETH,
      vWeEthsAddress: ethereumILDeployments.addresses.VToken_vweETHs_LiquidStakedETH,
      vWeEthStartBlock: '19638180',
      vWeEthsStartBlock: '20583508',
      template: 'template.yaml',
    },
    bsc: {
      network: 'bsc',
      vWeEthAddress: '0xc5b24f347254bD8cF8988913d1fd0F795274900F',
      vWeEthStartBlock: '41956130',
      template: 'template-bsc.yaml',
    },
  };
  const yamlTemplate = fs.readFileSync(config[network].template, 'utf8');
  const yamlOutput = Mustache.render(yamlTemplate, config[network]);
  fs.writeFileSync('subgraph.yaml', yamlOutput);
};

main();
