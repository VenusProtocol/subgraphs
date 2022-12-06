import { exec, fetchSubgraph, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from '../constants';

const deploy = async () => {
  const root = `${__dirname}/../../..`;

  // Create Subgraph Connection
  const subgraph = fetchSubgraph(SUBGRAPH_ACCOUNT, SUBGRAPH_NAME);

  // Build and Deploy Subgraph
  console.log('Build and deploy subgraph...');
  exec(`yarn workspace isolated-pools-subgraph run prepare:local`, root);
  exec(`yarn workspace isolated-pools-subgraph run codegen`, root);
  exec(`yarn workspace isolated-pools-subgraph run build:local`, root);
  exec(`yarn workspace isolated-pools-subgraph run create:local`, root);
  exec(
    `npx graph deploy ${SUBGRAPH_ACCOUNT}/${SUBGRAPH_NAME} --debug --ipfs http://ipfs:5001 --node http://graph-node:8020/ --version-label ${Date.now().toString()}`,
    root,
  );
  await waitForSubgraphToBeSynced(SYNC_DELAY);
  return { subgraph };
};

export default deploy;
