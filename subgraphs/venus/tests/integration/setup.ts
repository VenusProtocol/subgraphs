import { deploy } from '@venusprotocol/subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from './constants';

describe('Deploy Subgraph', function () {
  it('should deploy subgraph', async function () {
    const root = `${__dirname}/../..`;

    await deploy({
      root,
      packageName: '@venusprotocol/core-pool-subgraph',
      subgraphAccount: SUBGRAPH_ACCOUNT,
      subgraphName: SUBGRAPH_NAME,
      syncDelay: SYNC_DELAY,
    });
  });
});
