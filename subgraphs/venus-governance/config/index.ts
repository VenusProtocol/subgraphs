import bscMainnetGovernanceDeployments from '@venusprotocol/governance-contracts/deployments/bscmainnet.json';
import bscTestnetGovernanceDeployments from '@venusprotocol/governance-contracts/deployments/bsctestnet.json';
import bscMainnetCoreDeployments from '@venusprotocol/venus-protocol/deployments/bscmainnet.json';
import bscTestnetCoreDeployments from '@venusprotocol/venus-protocol/deployments/bsctestnet.json';
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
      accessControlManagerAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      accessControlManagerStartBlock: '0',
      governorAlphaAddress: '0xF342E904702b1D021F03f519D6D9614916b03f37',
      governorAlphaStartBlock: '0',
      governorAlpha2Address: '0x325c8Df4CFb5B068675AFF8f62aA668D1dEc3C4B',
      governorAlpha2StartBlock: '0',
      governorBravoDelegatorAddress: '0x8E45C0936fa1a65bDaD3222bEFeC6a03C83372cE',
      governorBravoDelegatorStartBlock: '0',
      xvsTokenAddress: '0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575',
      xvsTokenStartBlock: '0',
      xvsVaultAddress: '0x82e01223d51Eb87e16A03E24687EDF0F294da6f1',
      xvsVaultStartBlock: '0',
      xvsVaultPid: '0',
    },
    chapel: {
      network: 'chapel',
      accessControlManagerAddress:
        bscTestnetGovernanceDeployments.contracts.AccessControlManager.address,
      accessControlManagerStartBlock: '24711629',
      governorAlphaAddress: bscTestnetGovernanceDeployments.contracts.GovernorAlpha.address,
      governorAlphaStartBlock: '8205736',
      governorAlpha2Address: '0x7116894ed34FC4B27D5b84f46B70Af48397a6C24',
      governorAlpha2StartBlock: '13584539',
      governorBravoDelegatorAddress:
        bscTestnetGovernanceDeployments.contracts.GovernorBravoDelegator.address,
      governorBravoDelegatorStartBlock: '16002994 ',
      xvsTokenAddress: bscTestnetCoreDeployments.contracts.XVS.address,
      xvsTokenStartBlock: '2802593',
      xvsVaultAddress: bscTestnetCoreDeployments.contracts.XVSVault.address,
      xvsVaultStartBlock: '13937802',
      xvsVaultPid: '1',
    },
    bsc: {
      network: 'bsc',
      accessControlManagerAddress:
        bscMainnetGovernanceDeployments.contracts.AccessControlManager.address,
      accessControlManagerStartBlock: '21968138',
      governorAlphaAddress: bscMainnetGovernanceDeployments.contracts.GovernorAlpha.address,
      governorAlphaStartBlock: '2474351',
      governorAlpha2Address: bscMainnetGovernanceDeployments.contracts.GovernorAlpha2.address,
      governorAlpha2StartBlock: '11934064',
      governorBravoDelegatorAddress:
        bscMainnetGovernanceDeployments.contracts.GovernorBravoDelegator.address,
      governorBravoDelegatorStartBlock: '13729317',
      xvsTokenAddress: bscMainnetCoreDeployments.contracts.XVS.address,
      xvsTokenStartBlock: '858561',
      xvsVaultAddress: bscMainnetCoreDeployments.contracts.XVSVault.address,
      xvsVaultStartBlock: '13018718',
      xvsVaultPid: '0',
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
