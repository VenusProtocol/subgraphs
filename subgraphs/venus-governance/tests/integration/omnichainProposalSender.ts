import '@nomiclabs/hardhat-ethers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { numberToByteId, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client/index';
import { SYNC_DELAY } from './utils/constants';

describe('OmnichainProposalSender', function () {
  before(async function () {
    await waitForSubgraphToBeSynced(SYNC_DELAY);
  });

  it('should index SetTrustedRemoteAddress', async function () {
    const omnichainProposalSender = await ethers.getContract('OmnichainProposalSender');
    const omnichainExecutorOwner = await ethers.getContract('OmnichainExecutorOwner');
    const accessControlManager = await ethers.getContract('AccessControlManager');
    const [root] = await ethers.getSigners();
    await accessControlManager.giveCallPermission(
      ethers.constants.AddressZero,
      'setTrustedRemoteAddress(uint16,bytes)',
      root.address,
    );

    const tx = await omnichainProposalSender.setTrustedRemoteAddress(
      21,
      omnichainExecutorOwner.address,
    );
    await tx.wait();
    await waitForSubgraphToBeSynced(SYNC_DELAY);
    const { data } = await subgraphClient.getTrustedRemote({ id: numberToByteId(21) });
    const { trustedRemote } = data!;
    expect(trustedRemote.active).to.be.true;
    expect(trustedRemote.address).to.be.equal(omnichainExecutorOwner.address.toLowerCase());
    expect(trustedRemote.proposals.length).to.be.equal(0);
  });
});
