import '@nomiclabs/hardhat-ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ApolloFetch, FetchResult } from 'apollo-fetch';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
// Utils
import { exec, normalizeMantissa, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import { SYNC_DELAY } from './constants';
// Queries
import { queryProposalById } from './queries';
import { deployContracts } from './utils/deploy';
import { enfranchiseAccount } from './utils/voter';

// Test
describe('Alpha', function () {
  let subgraph: ApolloFetch;
  let signers: SignerWithAddress[];
  let governorAlpha: Contract;
  let xvs: Contract;
  let xvsVault: Contract;

  before(async function () {
    this.timeout(50000); // sometimes it takes a long time

    signers = await ethers.getSigners();
    ({ subgraph, governorAlpha, xvs, xvsVault } = await deployContracts());
  });

  after(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`, __dirname);

    process.stdout.write('Clean up complete.');
  });

  it('indexes created proposals - alpha', async function () {
    const [_, user1] = signers; // eslint-disable-line @typescript-eslint/no-unused-vars
    await enfranchiseAccount(xvs, xvsVault, user1, normalizeMantissa(40e4, 1e18));

    const callData = ethers.utils.defaultAbiCoder.encode(['address'], [governorAlpha.address]);

    const vip = [
      ['0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'], // targets
      ['0'], // values
      ['setPendingAdmin(address)'], // signatures
      [callData], // params
      'Test proposal 1', // description
    ];

    const tx = await governorAlpha.connect(user1).propose(...vip);
    await tx.wait(1);

    await waitForSubgraphToBeSynced(SYNC_DELAY);

    const query = await queryProposalById('1');
    const {
      data: { proposal },
    } = (await subgraph({ query })) as FetchResult;

    expect(proposal.id).to.be.equal('1');
    expect(proposal.description).to.be.equal('Test proposal 1');
    expect(proposal.status).to.be.equal('PENDING');
    expect(proposal.executionETA).to.be.null;
    expect(proposal.targets).to.deep.equal([
      '0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'.toLowerCase(),
    ]);
    expect(proposal.values).to.deep.equal(['0']);
    expect(proposal.signatures).to.deep.equal(['setPendingAdmin(address)']);
    expect(proposal.calldatas).to.deep.equal([callData]);
  });
});
