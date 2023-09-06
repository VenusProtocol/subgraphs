import mainnetDeployments from '@venusprotocol/isolated-pools/deployments/bscmainnet.json';
import sepoliaDeployments from '@venusprotocol/isolated-pools/deployments/bsctestnet.json';
import chapelDeployments from '@venusprotocol/isolated-pools/deployments/bsctestnet.json';
import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = ['sepolia', 'chapel', 'bsc', 'local'] as const;
  const network = process.env.NETWORK;
  // @ts-expect-error network env var is unknown here
  if (!supportedNetworks.includes(network)) {
    throw new Error(`NETWORK env var must be set to one of ${supportedNetworks}`);
  }
  return network as typeof supportedNetworks[number];
};

const main = () => {
  const network = getNetwork();
  const config = {
    local: {
      network: 'hardhat',
      poolRegistryAddress: '0x95401dc811bb5740090279Ba06cfA8fcF6113778',
      poolLensAddress: '0x809d550fca64d94Bd9F66E60752A544199cfAC3D',
      startBlock: 0,
    },
    sepolia: {
      network: 'sepolia',
      poolRegistryAddress: sepoliaDeployments.contracts.PoolRegistry.address,
      poolLensAddress: sepoliaDeployments.contracts.PoolLens.address,
      startBlock: '3930059',
    },
    chapel: {
      network: 'chapel',
      poolRegistryAddress: chapelDeployments.contracts.PoolRegistry.address,
      poolLensAddress: chapelDeployments.contracts.PoolLens.address,
      startBlock: '30870000',
    },
    bsc: {
      network: 'bsc',
      poolRegistryAddress: mainnetDeployments.contracts.PoolRegistry.address,
      poolLensAddress: mainnetDeployments.contracts.PoolLens.address,
      startBlock: '29300000',
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
