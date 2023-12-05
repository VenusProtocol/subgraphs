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
      governorAlphaAddress: '0x95775fD3Afb1F4072794CA4ddA27F2444BCf8Ac3',
      governorAlphaStartBlock: '0',
      governorAlpha2Address: '0x512F7469BcC83089497506b5df64c6E246B39925',
      governorAlpha2StartBlock: '0',
      governorBravoDelegatorAddress: '0xE8F7d98bE6722d42F29b50500B0E318EF2be4fc8',
      governorBravoDelegatorStartBlock: '0',
      xvsTokenAddress: '0x1343248Cbd4e291C6979e70a138f4c774e902561',
      xvsTokenStartBlock: '0',
      xvsVaultAddress: '0x547382C0D1b23f707918D3c83A77317B71Aa8470',
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
      accessControlManagerStartBlock: '',
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
