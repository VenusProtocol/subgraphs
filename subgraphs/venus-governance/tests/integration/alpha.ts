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

  before(async function () {
    this.timeout(50000000); // sometimes it takes a long time
    governorAlpha = await ethers.getContract('GovernorAlpha');
    governorAlpha2 = await ethers.getContract('GovernorAlpha2');
    signers = await ethers.getSigners();

    const [_, user1, user2, user3, user4] = signers;

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
      const [_, user1, user2, user3, user4] = signers;

      const time = Date.now() + 106400;
      await ethers.provider.send('evm_setNextBlockTimestamp', [time]);
      await mine(1);

      let tx = await governorAlpha.connect(user1).castVote('1', false);
      await tx.wait(1);
      tx = await governorAlpha.connect(user2).castVote('1', true);
      await tx.wait(1);
      tx = await governorAlpha.connect(user3).castVote('1', true);
      await tx.wait(1);
      tx = await governorAlpha.connect(user4).castVote('1', true);
      await tx.wait(1);

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { proposal },
      } = await subgraphClient.getProposalById('1');
      expect(proposal.votes.length).to.be.equal(4);

      const {
        data: { delegate: delegate1 },
      } = await subgraphClient.getDelegateById(user1.address.toLowerCase());

      expect(delegate1.votes[0].id).to.equal(`${user1.address.toLowerCase()}-0x1`);
      expect(delegate1.votes[0].support).to.equal('AGAINST');
      expect(delegate1.votes[0].votes).to.equal('100000000000000000000000');
      expect(delegate1.proposals).to.deep.equal([]);

      const {
        data: { delegate: delegate2 },
      } = await subgraphClient.getDelegateById(user2.address.toLowerCase());
      expect(delegate2.votes[0].id).to.equal(`${user2.address.toLowerCase()}-0x1`);
      expect(delegate2.votes[0].support).to.equal('FOR');
      expect(delegate2.votes[0].votes).to.equal('200000000000000000000000');
      expect(delegate2.proposals).to.deep.equal([]);
      expect(delegate2.proposals).to.deep.equal([]);

      const {
        data: { delegate: delegate4 },
      } = await subgraphClient.getDelegateById(user4.address.toLowerCase());
      expect(delegate4.proposals).to.deep.equal([{ id: '1', __typename: 'Proposal' }]);
    });
  });

  // @TODO Update proposal Status
  // @TODO Changing delegates
  // @TODO Governance

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

      const tx = await governorAlpha2.connect(user1).propose(...vip);
      await tx.wait(1);

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { proposal },
      } = await subgraphClient.getProposalById('21');

      expect(proposal.id).to.be.equal('21');
      expect(proposal.description).to.be.equal('Test proposal 21');
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
});
