#!/usr/bin/env ts-node
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
      comptrollerAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      startBlock: '0',
    },
    chapel: {
      network: 'chapel',
      comptrollerAddress: bscTestnetCoreDeployments.addresses.Unitroller,
      startBlock: '2802485',
    },
    bsc: {
      network: 'bsc',
      comptrollerAddress: bscMainnetCoreDeployments.addresses.Unitroller,
      startBlock: '2471512',
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
