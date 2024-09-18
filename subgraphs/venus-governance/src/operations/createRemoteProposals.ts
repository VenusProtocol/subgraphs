import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';

import { ProposalCreated as ProposalCreatedV2 } from '../../generated/GovernorBravoDelegate2/GovernorBravoDelegate2';
import { RemoteProposal } from '../../generated/schema';
import { DYNAMIC_TUPLE_BYTES_PREFIX } from '../constants';

class RemoteCommandMap {
  sourceProposalId: BigInt;
  calldatas: Bytes[];
  targets: Address[];
  constructor(sourceProposalId: BigInt, targets: Address[], calldatas: Bytes[]) {
    this.sourceProposalId = sourceProposalId;
    this.calldatas = calldatas;
    this.targets = targets;
  }
}

const createRemoteProposals = (event: ProposalCreatedV2): void => {
  const targets = event.params.targets;
  const signatures = event.params.signatures;
  const calldatas = event.params.calldatas;
  const sourceProposalId = event.params.id;

  signatures.reduce<RemoteCommandMap>((acc, curr, idx) => {
    if (curr == 'execute(uint16,bytes,bytes,address)') {
      const decoded = ethereum.decode(
        '(uint16,bytes,bytes,address)',
        DYNAMIC_TUPLE_BYTES_PREFIX.concat(acc.calldatas[idx]),
      )!;
      const layerZeroChainId = decoded.toTuple()[0].toI32();
      const payload = decoded.toTuple()[1].toBytes();
      const payloadDecoded = ethereum
        .decode(
          '(address[],uint256[],string[],bytes[],uint8)',
          DYNAMIC_TUPLE_BYTES_PREFIX.concat(payload),
        )!
        .toTuple();

      const remoteProposalId = Bytes.fromI32(layerZeroChainId).concat(
        Bytes.fromByteArray(Bytes.fromBigInt(acc.sourceProposalId)),
      );
      const remoteProposal = new RemoteProposal(remoteProposalId);

      remoteProposal.trustedRemote = Bytes.fromI32(layerZeroChainId); // default value replaced in event handler
      remoteProposal.sourceProposal = acc.sourceProposalId.toString();
      const targets = payloadDecoded[0]
        .toAddressArray()
        .map<Bytes>((address: Address) => Bytes.fromHexString(address.toHexString()));

      remoteProposal.targets = targets;
      remoteProposal.values = payloadDecoded[1].toBigIntArray();
      remoteProposal.signatures = payloadDecoded[2].toStringArray();
      remoteProposal.calldatas = payloadDecoded[3].toBytesArray();
      remoteProposal.type = payloadDecoded[4].toI32();
      remoteProposal.save();
    }

    return acc;
  }, new RemoteCommandMap(sourceProposalId, targets, calldatas));
};

export default createRemoteProposals;
