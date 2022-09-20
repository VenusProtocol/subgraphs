import '@nomiclabs/hardhat-ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
// Utils
import { exec, normalizeMantissa, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import { SYNC_DELAY } from './constants';
// Queries
import { transferToAccount } from './utils/transferToAccount';

// Test
describe('Comptroller', function () {
  let signers: SignerWithAddress[];

  before(async function () {
    this.timeout(50000000); // sometimes it takes a long time

    signers = await ethers.getSigners();

    const [_, user1, user2] = signers; // eslint-disable-line @typescript-eslint/no-unused-vars
    await transferToAccount('vUSDC', user1, normalizeMantissa(10e4, 1e18));
    await transferToAccount('vETH', user2, normalizeMantissa(20e4, 1e18));
  });

  after(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`, __dirname);

    process.stdout.write('Clean up complete.');
  });

  it('indexes adding BNB market', async function () {
    await waitForSubgraphToBeSynced(SYNC_DELAY);
  });

  it('indexes adding stable coin markets', async function () {
    await waitForSubgraphToBeSynced(SYNC_DELAY);
  });

  it('indexes adding ERC20 token markets', async function () {
    await waitForSubgraphToBeSynced(SYNC_DELAY);
  });
});
