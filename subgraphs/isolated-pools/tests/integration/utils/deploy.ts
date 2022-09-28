import { ethers } from 'hardhat';
import {
  exec,
  fetchSubgraph,
  waitForSubgraphToBeSynced,
  writeSubgraphYaml,
} from 'venus-subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from '../constants';

const deploy = async () => {
  const poolLens = await ethers.getContract('PoolLens');

  const poolRegistry = await ethers.getContract('PoolRegistry');

  const root = `${__dirname}/../../..`;

  const templateVars = {
    network: 'bsc',
    address: poolRegistry.address,
    startBlock: 0,
    poolLensAddress: poolLens.address,
  };
  await writeSubgraphYaml(root, templateVars);

  // Create Subgraph Connection
  const subgraph = fetchSubgraph(SUBGRAPH_ACCOUNT, SUBGRAPH_NAME);

  // Build and Deploy Subgraph
  console.log('Build and deploy subgraph...');
  // exec(`npx hardhat compile`);
  exec(`yarn workspace isolated-pools-subgraph run codegen`, root);
  exec(`yarn workspace isolated-pools-subgraph run build:local`, root);
  exec(`yarn workspace isolated-pools-subgraph run create:local`, root);
  exec(
    `graph deploy venusprotocol/venus-isolated-pools --debug --ipfs http://localhost:5001 --node http://127.0.0.1:8020/ --version-label ${Date.now().toString()}`,
    root,
  );

  await waitForSubgraphToBeSynced(SYNC_DELAY);

  return { subgraph };
};

export default deploy;
