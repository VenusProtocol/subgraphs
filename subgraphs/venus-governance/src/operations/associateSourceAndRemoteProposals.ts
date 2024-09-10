import { BigInt, ByteArray, Bytes, crypto, ethereum } from '@graphprotocol/graph-ts';

import { DYNAMIC_TUPLE_BYTES_PREFIX } from '../constants';
import { getOrCreateDefaultRemoteProposal } from './getOrCreate';

type RemoteProposalArray = BigInt[];

class RemoteToSourceProposalMap {
  current: BigInt;
  proposals: RemoteProposalArray[];
  constructor() {
    this.current = BigInt.fromI32(0);
    this.proposals = [];
  }
}
const associateSourceAndRemoteProposals = (event: ethereum.Event): void => {
  if (event.receipt) {
    const reversedLogs = event.receipt!.logs.reverse();
    const organizedProposals = reversedLogs.reduce<RemoteToSourceProposalMap>((acc, curr) => {
      const proposalExecutedTopic = Bytes.fromByteArray(
        crypto.keccak256(ByteArray.fromUTF8('ProposalExecuted(uint256)')),
      );
      const executeRemoteProposalTopic = Bytes.fromByteArray(
        crypto.keccak256(ByteArray.fromUTF8('ExecuteRemoteProposal(uint16,uint256,bytes)')),
      );
      const storePayloadTopic = Bytes.fromByteArray(
        crypto.keccak256(
          ByteArray.fromUTF8('StorePayload(uint256,uint16,bytes,bytes,uint256,bytes)'),
        ),
      );

      if (curr.topics.includes(proposalExecutedTopic)) {
        const proposalId = ethereum.decode('(uint256)', curr.data)!.toTuple()[0].toBigInt();
        acc.current = proposalId;
      }

      if (curr.topics.includes(executeRemoteProposalTopic)) {
        const proposalId = ethereum
          .decode('(uint256,bytes)', DYNAMIC_TUPLE_BYTES_PREFIX.concat(curr.data))!
          .toTuple()[0]
          .toBigInt();
        acc.proposals.push([acc.current, proposalId]);
      }

      if (curr.topics.includes(storePayloadTopic)) {
        const proposalId = ethereum.decode('(uint256)', curr.topics[1])!.toTuple()[0].toBigInt();
        acc.proposals.push([acc.current, proposalId]);
      }

      return acc;
    }, new RemoteToSourceProposalMap());

    organizedProposals.proposals.forEach(p => {
      const remoteProposal = getOrCreateDefaultRemoteProposal(p[1]);
      remoteProposal.sourceProposal = p[0].toString();
      remoteProposal.save();
    });
  }
};

export default associateSourceAndRemoteProposals;
