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
      governorAlphaAddress: '0x2A590C461Db46bca129E8dBe5C3998A8fF402e76',
      governorAlphaStartBlock: '0',
      governorAlpha2Address: '0x9849832a1d8274aaeDb1112ad9686413461e7101',
      governorAlpha2StartBlock: '0',
      governorBravoDelegatorAddress: '0x5Ffe31E4676D3466268e28a75E51d1eFa4298620',
      governorBravoDelegatorStartBlock: '0',
      xvsTokenAddress: '0x4c5859f0F772848b2D91F1D83E2Fe57935348029',
      xvsTokenStartBlock: '0',
      xvsVaultAddress: '0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154',
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
      xvsVaultAddress: bscTestnetCoreDeployments.contracts.XVSVaultProxy.address,
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
      xvsVaultAddress: bscMainnetCoreDeployments.contracts.XVSVaultProxy.address,
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
