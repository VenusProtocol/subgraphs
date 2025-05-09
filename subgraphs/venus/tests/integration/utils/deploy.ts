import { exec, fetchSubgraph, waitForSubgraphToBeSynced } from '@venusprotocol/subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from '../constants';

const deploy = async () => {
  const root = __dirname;

  // Create Subgraph Connection
  const subgraph = fetchSubgraph(SUBGRAPH_ACCOUNT, SUBGRAPH_NAME);

  // Build and Deploy Subgraph
  console.log('Build and deploy subgraph...');
  exec(`yarn workspace @venusprotocol/core-pool-subgraph run prepare:docker`, root);
  exec(`yarn workspace @venusprotocol/core-pool-subgraph run codegen`, root);
  exec(`yarn workspace @venusprotocol/core-pool-subgraph run build:docker`, root);
  exec(`yarn workspace @venusprotocol/core-pool-subgraph run create:docker`, root);

  const deployCmd = `yarn graph deploy ${SUBGRAPH_ACCOUNT}/${SUBGRAPH_NAME} --ipfs http://ipfs:5001 --node http://graph-node:8020/ --version-label v${Date.now().toString()}`;
  exec(deployCmd, root);

  await waitForSubgraphToBeSynced(SYNC_DELAY);
  return { subgraph };
};

export default deploy;
