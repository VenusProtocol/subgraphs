import {
  exec,
  fetchSubgraph,
  waitForSubgraphToBeSynced,
  writeSubgraphYaml,
} from 'venus-subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from '../constants';

const deploy = async () => {
  await writeSubgraphYaml(`${__dirname}/../../..`, {});

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
