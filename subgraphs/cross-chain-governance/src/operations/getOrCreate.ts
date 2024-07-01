import { Address, Bytes } from '@graphprotocol/graph-ts';

import { OmnichainGovernanceExecutor } from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';
import {
  DestinationChain,
  FunctionRegistry,
  Governance,
  GovernanceRoute,
  TrustedRemote,
} from '../../generated/schema';
import { BIGINT_ZERO } from '../constants';
import {
  omnichainExecutorOwnerAddress,
  omnichainGovernanceOwnerAddress,
} from '../constants/addresses';
import { layerZeroChainId } from '../constants/config';
import {
  getDestinationChainId,
  getGovernanceId,
  getGovernanceRouteId,
  getRemoteChainId,
} from '../utilities/ids';

export const getOrCreateFunctionRegistry = (signature: Bytes): FunctionRegistry => {
  let functionRegistry = FunctionRegistry.load(signature);
  if (!functionRegistry) {
    functionRegistry = new FunctionRegistry(signature);
    functionRegistry.signature = signature.toString();
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

export const getOrCreateGovernanceRoute = (
  routeType: i32,
  timelockAddress: Address,
): GovernanceRoute => {
  let governanceRoute = GovernanceRoute.load(getGovernanceRouteId(routeType));
  if (!governanceRoute) {
    governanceRoute = new GovernanceRoute(getGovernanceRouteId(routeType));
  }
  governanceRoute.timelockAddress = timelockAddress;
  governanceRoute.save();
  return governanceRoute;
};

export const getOrCreateDestinationChain = (destinationChainId: i32): DestinationChain => {
  let destinationChain = DestinationChain.load(getDestinationChainId(destinationChainId));
  if (!destinationChain) {
    destinationChain = new DestinationChain(getDestinationChainId(destinationChainId));
    destinationChain.chainId = destinationChainId;
  }
  return destinationChain;
};

export const getOrCreateTrustedRemote = (remoteChainId: i32): TrustedRemote => {
  let trustedRemote = TrustedRemote.load(getRemoteChainId(remoteChainId));
  if (!trustedRemote) {
    trustedRemote = new TrustedRemote(getRemoteChainId(remoteChainId));
  }
  return trustedRemote;
};
