import fs from 'fs';
import { ethers } from 'hardhat';
import Mustache from 'mustache';
import {
  deployAndConfigureXvsVault,
  deployGovernorAlpha,
  deployGovernorAlpha2,
  deployGovernorBravoDelegate,
  deployGovernorBravoDelegator,
} from 'venus-protocol/script/hardhat';
import { exec, fetchSubgraph, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from '../constants';

export const deployContracts = async () => {
  const [root] = await ethers.getSigners();

  const guardianAddress = root.address;

  const contracts = await deployAndConfigureXvsVault();
  const { timelock, xvs, xvsVault } = contracts;
  const xvsAddress = xvs.address;
  const timelockAddress = timelock.address;
  const xvsVaultAddress = xvsVault.address;

  const governorAlpha = await deployGovernorAlpha({
    timelockAddress,
    xvsVaultAddress,
    guardianAddress,
  });
  const governorAlphaAddress = governorAlpha.address;

  const governorAlpha2 = await deployGovernorAlpha2({
    timelockAddress,
    xvsVaultAddress,
    guardianAddress,
    lastProposalId: 20,
  });
  const governorAlpha2Address = governorAlpha2.address;

  const governorBravoDelegate = await deployGovernorBravoDelegate();
  const governorBravoDelegateAddress = governorBravoDelegate.address;

  await deployGovernorBravoDelegator({
    timelockAddress,
    xvsVaultAddress,
    guardianAddress,
    governorBravoDelegateAddress,
  });

  // Read yaml template
  const yamlTemplate = await fs.promises.readFile(`${__dirname}/../../../template.yaml`, 'binary');
  if (yamlTemplate) {
    const templateValues = {
      governorAlphaAddress,
      governorAlpha2Address,
      governorBravoDelegateAddress,
      venusTokenAddress: xvsAddress,
      xvsVaultAddress,
      governorAlphaStartBlock: 0,
      governorAlpha2StartBlock: 0,
      governorBravoDelegateBlock: 0,
      governorBravoDelegateStartBlock: 0,
      venusTokenStartBlock: 0,
      xvsVaultStartBlock: 0,
      network: 'bsc',
    };
    console.log('writing subgraph.yaml', templateValues);
    const renderedTemplate = Mustache.render(yamlTemplate, templateValues);
    await fs.writeFileSync(`${__dirname}/../../../subgraph.yaml`, renderedTemplate);
  } else {
    throw Error('Unable to write subgraph.yaml from template');
  }

  // Create Subgraph Connection
  const subgraph = fetchSubgraph(SUBGRAPH_ACCOUNT, SUBGRAPH_NAME);

  // Build and Deploy Subgraph
  console.log('Build and deploy subgraph...');

  exec('yarn workspace venus-governance run codegen', __dirname);
  exec('yarn workspace venus-governance run create:local', __dirname);
  exec(
    `yarn workspace venus-governance run deploy:integration -l ${Date.now().toString()}`,
    __dirname,
  );

  await waitForSubgraphToBeSynced(SYNC_DELAY);

  return {
    subgraph,
    xvs,
    xvsVault,
    governorAlpha,
    governorAlpha2,
    governorBravoDelegate,
  };
};
