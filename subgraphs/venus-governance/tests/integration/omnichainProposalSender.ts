import '@nomiclabs/hardhat-ethers';
import { numberToByteId, waitForSubgraphToBeSynced } from '@venusprotocol/subgraph-utils';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import subgraphClient from '../../subgraph-client/index';
import { SYNC_DELAY } from './utils/constants';

describe('OmnichainProposalSender', function () {
  let omnichainProposalSender: Contract;
  before(async function () {
    omnichainProposalSender = await ethers.getContract('OmnichainProposalSender');
  });

  it('should index SetTrustedRemoteAddress', async function () {
    const omnichainExecutorOwner = await ethers.getContract('OmnichainExecutorOwner');

    const tx = await omnichainProposalSender.setTrustedRemoteAddress(21, omnichainExecutorOwner.address);
    await tx.wait();
    await waitForSubgraphToBeSynced(SYNC_DELAY);
    const { data } = await subgraphClient.getTrustedRemote({ id: numberToByteId(21) });
    const { trustedRemote } = data!;
    expect(trustedRemote.active).to.be.true;
    expect(trustedRemote.address).to.be.equal(omnichainExecutorOwner.address.toLowerCase());
    expect(trustedRemote.proposals.length).to.be.equal(0);
  });
});
