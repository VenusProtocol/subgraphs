import fs from 'fs';
import Mustache from 'mustache';
import { exec, fetchSubgraph, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from '../constants';

const deploy = async () => {
  // Read yaml template
  const yamlTemplate = await fs.promises.readFile(`${__dirname}/../../../template.yaml`, 'binary');
  if (yamlTemplate) {
    const renderedTemplate = Mustache.render(yamlTemplate, {});
    await fs.writeFileSync(`${__dirname}/../../../subgraph.yaml`, renderedTemplate);
  } else {
    throw Error('Unable to write subgraph.yaml from template');
  }

  // Create Subgraph Connection
  const subgraph = fetchSubgraph(SUBGRAPH_ACCOUNT, SUBGRAPH_NAME);

  // Build and Deploy Subgraph
  console.log('Build and deploy subgraph...');
  // exec(`npx hardhat compile`);
  exec(`yarn workspace isolated-pools-subgraph run codegen`, __dirname);
  exec(`yarn workspace isolated-pools-subgraph run build:local`, __dirname);
  exec(`yarn workspace isolated-pools-subgraph run create:local`, __dirname);
  exec(`yarn workspace isolated-pools-subgraph run deploy:local`, __dirname);

  await waitForSubgraphToBeSynced(SYNC_DELAY);
  return { subgraph };
};

export default deploy;
