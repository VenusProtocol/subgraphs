import bscMainnetGovernanceDeployments from '@venusprotocol/governance-contracts/deployments/bscmainnet.json';
import bscTestnetGovernanceDeployments from '@venusprotocol/governance-contracts/deployments/bsctestnet.json';
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
      accessControlManagerAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      accessControlManagerStartBlock: '0',
      governorAlphaAddress: '0x8ac5eE52F70AE01dB914bE459D8B3d50126fd6aE',
      governorAlphaStartBlock: '0',
      governorAlpha2Address: '0x627b9A657eac8c3463AD17009a424dFE3FDbd0b1',
      governorAlpha2StartBlock: '0',
      governorBravoDelegatorAddress: '0x262e2b50219620226C5fB5956432A88fffd94Ba7',
      governorBravoDelegatorStartBlock: '0',
      xvsTokenAddress: '0xCD8a1C3ba11CF5ECfa6267617243239504a98d90',
      xvsTokenStartBlock: '0',
      xvsVaultAddress: '0x2bdCC0de6bE1f7D2ee689a0342D76F52E8EFABa3',
      xvsVaultStartBlock: '0',
      xvsVaultPid: '0',
      omnichainProposalSenderAddress: '0xBEe6FFc1E8627F51CcDF0b4399a1e1abc5165f15',
      omnichainProposalSenderStartBlock: '0',
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
      xvsTokenAddress: bscTestnetCoreDeployments.addresses.XVS,
      xvsTokenStartBlock: '2802593',
      xvsVaultAddress: bscTestnetCoreDeployments.addresses.XVSVaultProxy,
      xvsVaultStartBlock: '13937802',
      xvsVaultPid: '1',
      omnichainProposalSenderAddress: '0xCfD34AEB46b1CB4779c945854d405E91D27A1899',
      omnichainProposalSenderStartBlock: '40979674',
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
      xvsTokenAddress: bscMainnetCoreDeployments.addresses.XVS,
      xvsTokenStartBlock: '858561',
      xvsVaultAddress: bscMainnetCoreDeployments.addresses.XVSVaultProxy,
      xvsVaultStartBlock: '13018718',
      xvsVaultPid: '0',
      omnichainProposalSenderAddress: '0x36a69dE601381be7b0DcAc5D5dD058825505F8f6',
      omnichainProposalSenderStartBlock: '39375361',
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
