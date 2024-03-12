import { mine } from '@nomicfoundation/hardhat-network-helpers';
import '@nomiclabs/hardhat-ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { scaleValue, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client/index';
import { SYNC_DELAY } from './utils/constants';
import { enfranchiseAccount } from './utils/voter';

describe('GovernorAlpha', function () {
  let signers: SignerWithAddress[];
  let governorAlpha: Contract;
  let governorAlpha2: Contract;
  let _: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;

  before(async function () {
    governorAlpha = await ethers.getContract('GovernorAlpha');
    governorAlpha2 = await ethers.getContract('GovernorAlpha2');
    signers = await ethers.getSigners();

    [_, user1, user2, user3, user4] = signers;

    await enfranchiseAccount(user1, scaleValue(100000, 18));
    await enfranchiseAccount(user2, scaleValue(200000, 18));
    await enfranchiseAccount(user3, scaleValue(300000, 18));
    await enfranchiseAccount(user4, scaleValue(400000, 18));
    await waitForSubgraphToBeSynced(SYNC_DELAY);
  });

  describe('Alpha', function () {
    it('indexes created proposal success', async function () {
      const [_, _1, _2, _3, user4] = signers;
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

      const {
        data: { proposal },
      } = await subgraphClient.getProposalById('1');
      expect(proposal.id).to.be.equal('1');
      expect(proposal.description).to.be.equal('Test proposal 1');
      expect(proposal.executionEta).to.be.null;
      expect(proposal.targets).to.deep.equal([
        '0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'.toLowerCase(),
      ]);
      expect(proposal.values).to.deep.equal(['0']);
      expect(proposal.signatures).to.deep.equal(['setPendingAdmin(address)']);
      expect(proposal.calldatas).to.deep.equal([callData]);
    });

    it('index for vote cast', async function () {
      const [_, user1, user2, user3, user4] = signers;

      await mine(1);

      await governorAlpha.connect(user1).castVote('1', false);
      await governorAlpha.connect(user2).castVote('1', true);
      await governorAlpha.connect(user3).castVote('1', true);
      await governorAlpha.connect(user4).castVote('1', true);

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { proposal },
      } = await subgraphClient.getProposalById('1');
      expect(proposal.votes.length).to.be.equal(4);

      expect(proposal.forVotes).to.be.equal(scaleValue(1000000, 18).toFixed());
      expect(proposal.againstVotes).to.be.equal(scaleValue(100000, 18).toFixed());
      expect(proposal.abstainVotes).to.be.equal('0');

      const {
        data: { delegate: delegate1 },
      } = await subgraphClient.getDelegateById(user1.address.toLowerCase());

      expect(delegate1.votes[0].id).to.equal(`${user1.address.toLowerCase()}-1`);
      expect(delegate1.votes[0].support).to.equal('AGAINST');
      expect(delegate1.votes[0].votes).to.equal('100000000000000000000000');
      expect(delegate1.proposals).to.deep.equal([]);

      const {
        data: { delegate: delegate2 },
      } = await subgraphClient.getDelegateById(user2.address.toLowerCase());
      expect(delegate2.votes[0].id).to.equal(`${user2.address.toLowerCase()}-1`);
      expect(delegate2.votes[0].support).to.equal('FOR');
      expect(delegate2.votes[0].votes).to.equal('200000000000000000000000');
      expect(delegate2.proposals).to.deep.equal([]);

      const {
        data: { delegate: delegate4 },
      } = await subgraphClient.getDelegateById(user4.address.toLowerCase());
      expect(delegate4.proposals).to.deep.equal([{ id: '1', __typename: 'Proposal' }]);
    });

    it('should transition to canceled', async () => {
      await governorAlpha.connect(signers[0]).cancel('1');

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { proposal },
      } = await subgraphClient.getProposalById('1');

      expect(proposal.canceled).to.equal(true);
    });
  });

  describe('Alpha2', function () {
    it('indexes created proposals - alpha2', async function () {
      const [_, user1] = signers;
      await enfranchiseAccount(user1, scaleValue(600000, 18));

      const callData = ethers.utils.defaultAbiCoder.encode(['address'], [governorAlpha2.address]);

      const vip = [
        ['0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'], // targets
        ['0'], // values
        ['setPendingAdmin(address)'], // signatures
        [callData], // params
        'Test proposal 21', // description
      ];

      await governorAlpha2.connect(user1).propose(...vip);

      await mine(1);

      // Voting so it passes
      await governorAlpha2.connect(user4).castVote('21', true);
      await governorAlpha2.connect(user3).castVote('21', true);

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { proposal },
      } = await subgraphClient.getProposalById('21');

      expect(proposal.id).to.be.equal('21');
      expect(proposal.description).to.be.equal('Test proposal 21');
      expect(proposal.executionEta).to.be.null;
      expect(proposal.targets).to.deep.equal([
        '0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'.toLowerCase(),
      ]);
      expect(proposal.values).to.deep.equal(['0']);
      expect(proposal.signatures).to.deep.equal(['setPendingAdmin(address)']);
      expect(proposal.calldatas).to.deep.equal([callData]);

      expect(proposal.forVotes).to.be.equal(scaleValue(800000, 18).toFixed());
      expect(proposal.againstVotes).to.be.equal('0');
      expect(proposal.abstainVotes).to.be.equal('0');
    });

    it('should transition to queued', async () => {
      let votingPeriod = +(await governorAlpha2.votingPeriod());
      while (votingPeriod > 0) {
        votingPeriod--;
        await mine(1);
      }
      await waitForSubgraphToBeSynced(SYNC_DELAY);

      await governorAlpha2.queue(21);

      const governorAlpha2Timelock = await ethers.getContract('GovernorAlpha2Timelock');
      const eta =
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp +
        +(await governorAlpha2Timelock.delay());

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { proposal },
      } = await subgraphClient.getProposalById('21');

      expect(proposal.queued).to.equal(true);
      expect(proposal.executionEta).to.equal(eta.toString());
      await mine(1);

      await ethers.provider.send('evm_setNextBlockTimestamp', [eta]);
    });

    it('should transition to executed', async () => {
      await governorAlpha2.execute('21');

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { proposal },
      } = await subgraphClient.getProposalById('21');

      expect(proposal.executed).to.equal(true);
    });
  });
});
