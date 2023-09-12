import { exec, fetchSubgraph, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from '../constants';

const deploy = async () => {
  const root = __dirname;
  const env = process.env.LOCAL ? ('local' as const) : ('docker' as const);

  // Create Subgraph Connection
  const subgraph = fetchSubgraph(SUBGRAPH_ACCOUNT, SUBGRAPH_NAME);

  // Build and Deploy Subgraph
  console.log('Build and deploy subgraph...');
  exec(`yarn workspace isolated-pools-subgraph run prepare:${env}`, root);
  exec(`yarn workspace isolated-pools-subgraph run codegen`, root);
  exec(`yarn workspace isolated-pools-subgraph run build:${env}`, root);
  exec(`yarn workspace isolated-pools-subgraph run create:${env}`, root);

  const deployCmd =
    env === 'local'
      ? `npx graph deploy ${SUBGRAPH_ACCOUNT}/${SUBGRAPH_NAME} --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020/ --version-label ${Date.now().toString()}`
      : `npx graph deploy ${SUBGRAPH_ACCOUNT}/${SUBGRAPH_NAME} --ipfs http://ipfs:5001 --node http://graph-node:8020/ --version-label ${Date.now().toString()}`;
  exec(deployCmd, root);

  await waitForSubgraphToBeSynced(SYNC_DELAY);
  return { subgraph };
};

export default deploy;
