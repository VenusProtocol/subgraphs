import { BigInt, ByteArray, Bytes, crypto, ethereum } from '@graphprotocol/graph-ts';

import { DYNAMIC_TUPLE_BYTES_PREFIX } from '../constants';
import { getRemoteProposal } from './get';
import { getOrCreateRemoteProposalStateTransaction } from './getOrCreate';

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
      const proposalExecutedTopic = Bytes.fromByteArray(crypto.keccak256(ByteArray.fromUTF8('ProposalExecuted(uint256)')));
      const executeRemoteProposalTopic = Bytes.fromByteArray(crypto.keccak256(ByteArray.fromUTF8('ExecuteRemoteProposal(uint16,uint256,bytes)')));
      const storePayloadTopic = Bytes.fromByteArray(crypto.keccak256(ByteArray.fromUTF8('StorePayload(uint256,uint16,bytes,bytes,uint256,bytes)')));

      if (curr.topics[0].equals(proposalExecutedTopic)) {
        const proposalId = ethereum.decode('(uint256)', curr.data)!.toTuple()[0].toBigInt();
        acc.current = proposalId;
      }

      if (curr.topics[0].equals(executeRemoteProposalTopic)) {
        const layerZeroChainId = ethereum.decode('(uint16)', curr.topics[1])!.toTuple()[0].toBigInt();
        const remoteProposalId = ethereum.decode('(uint256,bytes)', DYNAMIC_TUPLE_BYTES_PREFIX.concat(curr.data))!.toTuple()[0].toBigInt();
        acc.proposals.push([layerZeroChainId, acc.current, remoteProposalId]);
      }

      if (curr.topics[0].equals(storePayloadTopic)) {
        const remoteProposalId = ethereum.decode('(uint256)', curr.topics[1])!.toTuple()[0].toBigInt();
        const layerZeroChainId = ethereum.decode('(uint16)', curr.topics[2])!.toTuple()[0].toBigInt();
        acc.proposals.push([layerZeroChainId, acc.current, remoteProposalId]);
      }

      return acc;
    }, new RemoteToSourceProposalMap());

    organizedProposals.proposals.forEach((p) => {
      const layerZeroChainId = p[0];
      const sourceProposalId = p[1];
      const remoteProposalId = p[2];
      const remoteProposal = getRemoteProposal(layerZeroChainId.toI32(), sourceProposalId);
      getOrCreateRemoteProposalStateTransaction(layerZeroChainId.toI32(), sourceProposalId, remoteProposalId);
      remoteProposal.proposalId = remoteProposalId;
      remoteProposal.save();
    });
  }
};

export default associateSourceAndRemoteProposals;
