import { deploy } from 'venus-subgraph-utils';

import { SUBGRAPH_ACCOUNT, SUBGRAPH_NAME, SYNC_DELAY } from './utils/constants';

describe('Deploy Subgraph', function () {
  it('should deploy subgraph', async function () {
    this.timeout(600000); // sometimes it takes a long time
    const root = `${__dirname}/../..`;

    await deploy({
      root,
      packageName: 'venus-governance-subgraph',
      subgraphAccount: SUBGRAPH_ACCOUNT,
      subgraphName: SUBGRAPH_NAME,
      syncDelay: SYNC_DELAY,
    });
  });
});
