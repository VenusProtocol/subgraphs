import '@nomiclabs/hardhat-ethers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { numberToByteId, waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client/index';
import { SYNC_DELAY } from './utils/constants';

const makePayload = async (
  targets: string[],
  values: number[],
  signatures: string[],
  calldatas: string[],
  proposalType: number,
) => {
  const payload = ethers.utils.defaultAbiCoder.encode(
    ['address[]', 'uint256[]', 'string[]', 'bytes[]', 'uint8'],
    [targets, values, signatures, calldatas, proposalType],
  );
  return payload;
};

describe('OmnichainProposalSender', function () {
  let omnichainProposalSender: Contract;
  let normalTimeLock: Contract;
  before(async function () {
    omnichainProposalSender = await ethers.getContract('OmnichainProposalSender');
    normalTimeLock = await ethers.getContract('NormalTimelock');
  });

  it('should index SetTrustedRemoteAddress', async function () {
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

  it('should index execute remote proposal', async function () {
    const calldata = ethers.utils.defaultAbiCoder.encode(['uint256'], [3600]);
    const proposalType = 0;
    const remoteChainId = 10102;
    const payload = await makePayload(
      [normalTimeLock.address],
      [0],
      ['setDelay(uint256)'],
      [calldata],
      proposalType,
    );
    const adapterParams = ethers.utils.solidityPack(['uint16', 'uint256'], [1, 500000]);
    const proposalId = +(await omnichainProposalSender.proposalCount()) + 1;

    const payloadWithIdEncoded = ethers.utils.defaultAbiCoder.encode(
      ['bytes', 'uint256'],
      [payload, proposalId],
    );
    const nativeFee = await omnichainProposalSender.estimateFees(
      remoteChainId,
      payloadWithIdEncoded,
      false,
      adapterParams,
    );
    await omnichainProposalSender.execute(10102, payload, '0x', ethers.constants.AddressZero, {
      value: ethers.utils.parseEther((nativeFee[0] / 1e18 + 0.00001).toString()),
    });

    await waitForSubgraphToBeSynced(SYNC_DELAY);
    const {
      data: { remoteProposal },
    } = await subgraphClient.getRemoteProposal({ id: proposalId });

    expect(+remoteProposal.id).to.be.equal(proposalId);
    expect(+remoteProposal.proposalId).to.be.equal(proposalId);
    expect(remoteProposal.remoteChainId).to.be.equal(remoteChainId);
    expect(remoteProposal.targets[0]).to.be.equal(normalTimeLock.address.toLowerCase());
    expect(remoteProposal.values[0]).to.be.equal('0');
    expect(remoteProposal.signatures[0]).to.be.equal('setDelay(uint256)');
    expect(remoteProposal.calldatas[0]).to.be.equal(calldata);
    expect(remoteProposal.proposalType).to.be.equal(0);
    expect(remoteProposal.status).to.be.equal('STORED');
  });
});
