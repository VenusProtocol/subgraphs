import { Address, Bytes, ethereum } from '@graphprotocol/graph-ts';

import { OmnichainGovernanceExecutor } from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';
import { SetMinDstGas } from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';
import { DestinationChain, FunctionRegistry, Governance, GovernanceRoute, Transaction } from '../../generated/schema';
import { BIGINT_ZERO, indexProposalTypeConstant } from '../constants';
import { omnichainExecutorOwnerAddress, omnichainGovernanceOwnerAddress } from '../constants/addresses';
import { layerZeroChainId } from '../constants/config';
import { getDestinationChainId, getGovernanceId, getGovernanceRouteId } from '../utilities/ids';

export const getOrCreateFunctionRegistry = (signature: Bytes): FunctionRegistry => {
  let functionRegistry = FunctionRegistry.load(signature);
  if (!functionRegistry) {
    functionRegistry = new FunctionRegistry(signature);
    functionRegistry.signature = signature.toHexString();
  }
  functionRegistry.save();
  return functionRegistry;
};

export const getOrCreateGovernance = (): Governance => {
  let governance = Governance.load(getGovernanceId());
  const governanceContract = OmnichainGovernanceExecutor.bind(omnichainExecutorOwnerAddress);
  if (!governance) {
    governance = new Governance(getGovernanceId());
    governance.address = omnichainGovernanceOwnerAddress;
    governance.executor = omnichainExecutorOwnerAddress;
    governance.guardian = governanceContract.guardian();
    governance.srcChainId = governanceContract.srcChainId();
    governance.layerZeroChainId = layerZeroChainId;
    governance.maxDailyReceiveLimit = BIGINT_ZERO;
    governance.paused = false;
    governance.save();
  }
  return governance;
};

export const getOrCreateGovernanceRoute = (routeType: i32, timelockAddress: Address): GovernanceRoute => {
  let governanceRoute = GovernanceRoute.load(getGovernanceRouteId(routeType));
  if (!governanceRoute) {
    governanceRoute = new GovernanceRoute(getGovernanceRouteId(routeType));
  }
  governanceRoute.timelockAddress = timelockAddress;
  governanceRoute.type = indexProposalTypeConstant[routeType];
  governanceRoute.save();
  return governanceRoute;
};

export const getOrCreateDestinationChain = (event: SetMinDstGas): DestinationChain => {
  const destinationChainId = event.params._dstChainId;
  let destinationChain = DestinationChain.load(getDestinationChainId(destinationChainId));
  if (!destinationChain) {
    destinationChain = new DestinationChain(getDestinationChainId(destinationChainId));
    destinationChain.chainId = destinationChainId;
    destinationChain.packetType = event.params._type;
    destinationChain.minGas = event.params._minDstGas;
    destinationChain.save();
  }
  return destinationChain;
};

export const getOrCreateTransaction = (event: ethereum.Event): Transaction => {
  let transaction = Transaction.load(event.transaction.hash);
  if (!transaction) {
    transaction = new Transaction(event.transaction.hash);
    transaction.blockNumber = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.txHash = event.transaction.hash;
    transaction.save();
  }
  return transaction;
};
