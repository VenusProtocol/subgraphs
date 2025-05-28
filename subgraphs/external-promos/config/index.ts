#!/usr/bin/env ts-node
import arbitrumILDeployments from '@venusprotocol/isolated-pools/deployments/arbitrumone_addresses.json';
import bscILDeployments from '@venusprotocol/isolated-pools/deployments/bscmainnet_addresses.json';
import ethereumILDeployments from '@venusprotocol/isolated-pools/deployments/ethereum_addresses.json';
import sepoliaILDeployments from '@venusprotocol/isolated-pools/deployments/sepolia_addresses.json';
import unichainILDeployments from '@venusprotocol/isolated-pools/deployments/unichainmainnet_addresses.json';
import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = [
    'sepolia',
    'ethereum',
    'docker',
    'bsc',
    'arbitrum',
    'unichain',
  ] as const;
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
      vWeEthStartBlock: '0',
      vWeEthsLSEthAddress: sepoliaILDeployments.addresses.VToken_vweETHs_LiquidStakedETH,
      vWeEthsLSEthStartBlock: '0',
      vWeEthsCoreAddress: sepoliaILDeployments.addresses.VToken_vweETHs_Core,
      vWeEthsCoreStartBlock: '0',
      veBTCAddress: sepoliaILDeployments.addresses.VToken_veBTC,
      veBTCStartBlock: '0',
      template: 'template-eth.yaml',
    },
    sepolia: {
      network: 'sepolia',
      vWeEthAddress: sepoliaILDeployments.addresses.VToken_vweETH_LiquidStakedETH,
      vWeEthStartBlock: '5659827',
      vWeEthsLSEthAddress: sepoliaILDeployments.addresses.VToken_vweETHs_LiquidStakedETH,
      vWeEthsLSEthStartBlock: '6536644',
      vWeEthsCoreAddress: sepoliaILDeployments.addresses.VToken_vweETHs_Core,
      vWeEthsCoreStartBlock: '7650833',
      veBTCAddress: sepoliaILDeployments.addresses.VToken_veBTC,
      veBTCStartBlock: '0',
      template: 'template-eth.yaml',
    },
    ethereum: {
      network: 'mainnet',
      vWeEthAddress: ethereumILDeployments.addresses.VToken_vweETH_LiquidStakedETH,
      vWeEthStartBlock: '19638180',
      vWeEthsLSEthAddress: ethereumILDeployments.addresses.VToken_vweETHs_LiquidStakedETH,
      vWeEthsLSEthStartBlock: '20583508',
      vWeEthsCoreAddress: ethereumILDeployments.addresses.VToken_vweETHs_Core,
      vWeEthsCoreStartBlock: '21786620',
      veBTCAddress: ethereumILDeployments.addresses.VToken_veBTC_Core,
      veBTCStartBlock: '21079720',
      template: 'template-eth.yaml',
    },
    bsc: {
      network: 'bsc',
      vWeEthAddress: bscILDeployments.addresses.VToken_vweETH_LiquidStakedETH,
      vWeEthStartBlock: '41956130',
      vAsBnbAddress: bscILDeployments.addresses.VToken_vasBNB_LiquidStakedBNB,
      vAsBnbStartBlock: '47620796',
      template: 'template-bsc.yaml',
    },
    arbitrum: {
      network: 'arbitrum-one',
      vWeEthAddress: arbitrumILDeployments.addresses.VToken_vweETH_LiquidStakedETH,
      vWeEthStartBlock: '245908467',
      template: 'template-arb.yaml',
    },
    unichain: {
      network: 'unichain-mainnet',
      vWeEthAddress: unichainILDeployments.addresses.VToken_vweETH_Core,
      vWeEthStartBlock: '16899141',
      template: 'template-arb.yaml',
    },
  };
  const yamlTemplate = fs.readFileSync(config[network].template, 'utf8');
  const yamlOutput = Mustache.render(yamlTemplate, config[network]);
  fs.writeFileSync('subgraph.yaml', yamlOutput);
};

main();
