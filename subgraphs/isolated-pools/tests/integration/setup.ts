import { deploy } from 'venus-subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from './constants';

describe('Deploy Subgraph', function () {
  it('should deploy subgraph', async function () {
    this.timeout(500000); // sometimes it takes a long time
    const root = `${__dirname}/../..`;

    await deploy({
      root,
      packageName: 'isolated-pools-subgraph',
      subgraphAccount: SUBGRAPH_ACCOUNT,
      subgraphName: SUBGRAPH_NAME,
      syncDelay: SYNC_DELAY,
    });
  });
});
