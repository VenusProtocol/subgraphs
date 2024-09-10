import '@nomiclabs/hardhat-ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { scaleValue, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client/index';
import { SYNC_DELAY } from './utils/constants';

describe('XVS Vault and Delegation', function () {
  let signers: SignerWithAddress[];
  let xvsVault: Contract;
  let xvs: Contract;

  const amount = scaleValue(100000, 18);

  before(async function () {
    signers = await ethers.getSigners();

    xvs = await ethers.getContract('XVS');
    const xvsVaultProxy = await ethers.getContract('XVSVaultProxy');
    xvsVault = await ethers.getContractAt('XVSVault', xvsVaultProxy.address);

    await waitForSubgraphToBeSynced(SYNC_DELAY);
  });

  describe('XVS Delegation', function () {
    it('should create Delegate record on deposit ', async function () {
      const [_, user1, user2, user3] = signers;

      const amount = scaleValue(100000, 18);
      await xvs.connect(user1).approve(xvsVault.address, amount.times(10).toFixed());
      await xvs.connect(user2).approve(xvsVault.address, amount.times(10).toFixed());
      await xvs.connect(user3).approve(xvsVault.address, amount.times(10).toFixed());

      await xvs.transfer(user1.address, amount.times(10).toFixed());
      await xvs.transfer(user2.address, amount.times(10).toFixed());
      await xvs.transfer(user3.address, amount.times(10).toFixed());

      await xvsVault.connect(user1).deposit(xvs.address, 0, amount.toFixed());

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { delegate },
      } = await subgraphClient.getDelegateById(user1.address.toLowerCase());
      expect(delegate.stakedXvsMantissa).to.deep.equal(amount.toFixed());
      expect(delegate.totalVotesMantissa).to.deep.equal('0');

      await xvsVault.connect(user1).delegate(user1.address);
      await waitForSubgraphToBeSynced(SYNC_DELAY);
      const {
        data: { delegate: delegated },
      } = await subgraphClient.getDelegateById(user1.address.toLowerCase());
      expect(delegated.totalVotesMantissa).to.deep.equal(amount.toFixed());
    });

    it('should update delegate and votes with delegation event', async function () {
      const [_, user1, user2] = signers;

      await xvsVault.connect(user1).delegate(user2.address);

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { delegate: delegate1 },
      } = await subgraphClient.getDelegateById(user1.address.toLowerCase());

      expect(delegate1.delegateCount).to.equal(0);
      expect(delegate1.delegatee.id).to.equal(user2.address.toLowerCase());
      expect(delegate1.delegators).to.deep.equal([]);

      expect(delegate1.stakedXvsMantissa).to.deep.equal(amount.toFixed());
      expect(delegate1.totalVotesMantissa).to.equal('0');

      const {
        data: { delegate: delegate2 },
      } = await subgraphClient.getDelegateById(user2.address.toLowerCase());

      expect(delegate2.delegateCount).to.equal(1);
      expect(delegate2.delegators).to.deep.equal([
        { id: user1.address.toLowerCase(), __typename: 'Delegate' },
      ]);
      expect(delegate2.stakedXvsMantissa).to.equal('0');
      expect(delegate2.totalVotesMantissa).to.equal(amount.toFixed());
    });

    it('should update delegatee when delegator deposits', async function () {
      const [_, user1, user2] = signers;

      await xvsVault.connect(user1).deposit(xvs.address, 0, amount.toFixed());

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { delegate: delegate1 },
      } = await subgraphClient.getDelegateById(user1.address.toLowerCase());
      expect(delegate1.stakedXvsMantissa).to.equal(amount.times(2).toFixed());
      expect(delegate1.totalVotesMantissa).to.equal('0');

      const {
        data: { delegate: delegate2 },
      } = await subgraphClient.getDelegateById(user2.address.toLowerCase());
      expect(delegate2.stakedXvsMantissa).to.equal('0');
      expect(delegate2.totalVotesMantissa).to.equal(amount.times(2).toFixed());
    });

    it('should update votes when delegate is changed to new account', async function () {
      const [_, user1, user2, user3] = signers;

      await xvsVault.connect(user3).deposit(xvs.address, 0, amount.toFixed());
      await xvsVault.connect(user1).delegate(user3.address);

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { delegate: delegate1 },
      } = await subgraphClient.getDelegateById(user1.address.toLowerCase());

      expect(delegate1.stakedXvsMantissa).to.equal(amount.times(2).toFixed());
      expect(delegate1.totalVotesMantissa).to.equal('0');
      expect(delegate1.delegatee.id).to.equal(user3.address.toLowerCase());

      const {
        data: { delegate: delegate2 },
      } = await subgraphClient.getDelegateById(user2.address.toLowerCase());

      expect(delegate2.stakedXvsMantissa).to.equal('0');
      expect(delegate2.totalVotesMantissa).to.equal('0');
      expect(delegate2.delegateCount).to.equal(0);
      expect(delegate2.delegators).to.deep.equal([]);

      const {
        data: { delegate: delegate3 },
      } = await subgraphClient.getDelegateById(user3.address.toLowerCase());

      expect(delegate3.delegateCount).to.equal(1);
      expect(delegate3.delegators).to.deep.equal([
        { id: user1.address.toLowerCase(), __typename: 'Delegate' },
      ]);
      expect(delegate3.stakedXvsMantissa).to.equal(amount.toFixed());
      expect(delegate3.totalVotesMantissa).to.equal(amount.times(2).toFixed());
    });

    it('should update votes when delegate is moved back to self', async function () {
      const [_, user1, _user2, user3] = signers;
      await xvsVault.connect(user1).delegate(user1.address);
      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { delegate: delegate1 },
      } = await subgraphClient.getDelegateById(user1.address.toLowerCase());

      expect(delegate1.delegateCount).to.equal(1);
      expect(delegate1.delegators).to.deep.equal([
        {
          id: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
          __typename: 'Delegate',
        },
      ]);
      expect(delegate1.stakedXvsMantissa).to.equal(amount.times(2).toFixed());
      expect(delegate1.totalVotesMantissa).to.equal(amount.times(2).toFixed());

      const {
        data: { delegate: delegate3 },
      } = await subgraphClient.getDelegateById(user3.address.toLowerCase());
      expect(delegate3.stakedXvsMantissa).to.equal(amount.toFixed());
      expect(delegate3.totalVotesMantissa).to.equal('0');
    });

    it('should update delegatee when delegator withdraws', async function () {
      const [_, user1, user2] = signers;
      await xvsVault.connect(user1).requestWithdrawal(xvs.address, 0, amount.toFixed());

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { delegate: delegate1 },
      } = await subgraphClient.getDelegateById(user1.address.toLowerCase());

      expect(delegate1.stakedXvsMantissa).to.equal(amount.toFixed());
      expect(delegate1.totalVotesMantissa).to.equal(amount.toFixed());

      const {
        data: { delegate: delegate2 },
      } = await subgraphClient.getDelegateById(user2.address.toLowerCase());

      expect(delegate2.stakedXvsMantissa).to.equal('0');
      expect(delegate2.totalVotesMantissa).to.equal('0');
    });

    it('should remove delegate when xvs is withdrawn', async function () {
      const [_, user1, user2] = signers;

      await xvsVault.connect(user1).requestWithdrawal(xvs.address, 0, amount.toFixed());

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { delegate: delegate1 },
      } = await subgraphClient.getDelegateById(user1.address.toLowerCase());

      expect(delegate1).to.equal(null);

      const {
        data: { delegate: delegate2 },
      } = await subgraphClient.getDelegateById(user2.address.toLowerCase());

      expect(delegate2.stakedXvsMantissa).to.equal('0');
      expect(delegate2.totalVotesMantissa).to.equal('0');
    });
  });
});
