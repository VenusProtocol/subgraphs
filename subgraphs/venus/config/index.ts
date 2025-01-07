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
      wbETHAddress: '0xf9f98365566f4d55234f24b99caa1afbe6428d44',
      vTRXAddress: '0x369fea97f6fb7510755dca389088d9e2e2819278',
      vTUSDOldAddress: '0x3a00d9b02781f47d033bad62edc55fbf8d083fb0',
    },
    bsc: {
      network: 'bsc',
      comptrollerAddress: bscMainnetCoreDeployments.addresses.Unitroller,
      startBlock: '2471512',
      vTRXAddress: '0x61edcfe8dd6ba3c891cb9bec2dc7657b3b422e93',
      vTUSDOldAddress: '0x08ceb3f4a7ed3500ca0982bcd0fc7816688084c3',
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
