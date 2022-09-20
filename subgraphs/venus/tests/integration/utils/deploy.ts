import fs from 'fs';
import { deployments } from 'hardhat';
import Mustache from 'mustache';
import { exec, fetchSubgraph, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from '../constants';

export const deploySubgraph = async () => {
  const comptrollerDeployment = await deployments.get('Comptroller');

  // Read yaml template
  const yamlTemplate = await fs.promises.readFile(`${__dirname}/../../../template.yaml`, 'binary');
  if (yamlTemplate) {
    const templateValues = {
      address: comptrollerDeployment.address,
      startBlock: 0,
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
  };
};
