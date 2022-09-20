import '@nomiclabs/hardhat-ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ApolloFetch, FetchResult } from 'apollo-fetch';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, network } from 'hardhat';
// Utils
import { exec, normalizeMantissa, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import { SYNC_DELAY } from './constants';
// Queries
import { queryDelegateById, queryProposalById } from './queries';
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
    this.timeout(50000000); // sometimes it takes a long time

    signers = await ethers.getSigners();
    ({ subgraph, governorAlpha, xvs, xvsVault } = await deployContracts());

    const [_, user1, user2, user3, user4] = signers; // eslint-disable-line @typescript-eslint/no-unused-vars
    await enfranchiseAccount(xvs, xvsVault, user1, normalizeMantissa(10e4, 1e18));
    await enfranchiseAccount(xvs, xvsVault, user2, normalizeMantissa(20e4, 1e18));
    await enfranchiseAccount(xvs, xvsVault, user3, normalizeMantissa(30e4, 1e18));
    await enfranchiseAccount(xvs, xvsVault, user4, normalizeMantissa(40e4, 1e18));
  });

  after(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`, __dirname);

    process.stdout.write('Clean up complete.');
  });

  it('indexes created proposal success', async function () {
    const [_, _1, _2, _3, user4] = signers; // eslint-disable-line @typescript-eslint/no-unused-vars
    const callData = ethers.utils.defaultAbiCoder.encode(['address'], [governorAlpha.address]);

    const vip = [
      ['0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'], // targets
      ['0'], // values
      ['setPendingAdmin(address)'], // signatures
      [callData], // params
      'Test proposal 1', // description
    ];

    const tx = await governorAlpha.connect(user4).propose(...vip);
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

  it('index for vote cast', async function () {
    const [_, user1, user2, user3, user4] = signers; // eslint-disable-line @typescript-eslint/no-unused-vars

    const time = Date.now() + 106400;
    await ethers.provider.send('evm_setNextBlockTimestamp', [time]);
    await ethers.provider.send('evm_mine', []);

    let tx = await governorAlpha.connect(user1).castVote('1', false);
    await tx.wait(1);
    tx = await governorAlpha.connect(user2).castVote('1', true);
    await tx.wait(1);
    tx = await governorAlpha.connect(user3).castVote('1', true);
    await tx.wait(1);
    tx = await governorAlpha.connect(user4).castVote('1', true);
    await tx.wait(1);

    await waitForSubgraphToBeSynced(SYNC_DELAY);

    const proposalByIdQuery = await queryProposalById('1');
    const {
      data: { proposal },
    } = (await subgraph({ query: proposalByIdQuery })) as FetchResult;
    expect(proposal.votes.length).to.be.equal(4);

    const delegate1Query = await queryDelegateById(user1.address.toLowerCase());
    const {
      data: { delegate: delegate1 },
    } = (await subgraph({ query: delegate1Query })) as FetchResult;
    expect(delegate1.delegatedVotes).to.be.equal('100000000000000000000000');
    expect(delegate1.votes).to.deep.equal([
      {
        id: `${user1.address.toLowerCase()}-0x1`,
        support: 'AGAINST',
        votes: '100000000000000000000000',
      },
    ]);
    expect(delegate1.proposals).to.deep.equal([]);

    const delegate2Query = await queryDelegateById(user2.address.toLowerCase());
    const {
      data: { delegate: delegate2 },
    } = (await subgraph({ query: delegate2Query })) as FetchResult;
    expect(delegate2.delegatedVotes).to.be.equal('200000000000000000000000');
    expect(delegate2.votes).to.deep.equal([
      {
        id: `${user2.address.toLowerCase()}-0x1`,
        support: 'FOR',
        votes: '200000000000000000000000',
      },
    ]);
    expect(delegate1.proposals).to.deep.equal([]);

    const delegate4Query = await queryDelegateById(user4.address.toLowerCase());
    const {
      data: { delegate: delegate4 },
    } = (await subgraph({ query: delegate4Query })) as FetchResult;
    expect(delegate4.proposals).to.deep.equal([{ id: '1' }]);
  });

  it('updates proposal status', async function () {
    const [_, user1] = signers; // eslint-disable-line @typescript-eslint/no-unused-vars

    const query = await queryProposalById('1');
    const {
      data: { proposal },
    } = (await subgraph({ query })) as FetchResult;

    const latestBlock = await ethers.provider.getBlock('latest');
    const toMine = proposal.endBlock - latestBlock.number + 1;

    await network.provider.send('hardhat_mine', [`0x${toMine.toString(16)}`]);
    await waitForSubgraphToBeSynced(SYNC_DELAY);
    const {
      data: { proposal: updatedProposal },
    } = (await subgraph({ query })) as FetchResult;

    // expect(updatedProposal.status).to.be.equal('SUCCEEDED');  // Fails no event for SUCCEEDED or DEFEATED
    // const latestBlock1 = await ethers.provider.getBlock("latest")
    console.log(proposal);
    // let tx = await governorAlpha.connect(user1).queue('1');
    // await tx.wait(1);
    expect(updatedProposal.status).to.be.equal('QUEUED');
  });
  // Changing delegates
  // Governance
});
