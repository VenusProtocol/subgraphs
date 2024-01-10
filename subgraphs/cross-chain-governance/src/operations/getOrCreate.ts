import { Address } from '@graphprotocol/graph-ts';

import { FunctionRegistry, Governance, GovernanceRoute } from '../../generated/schema';
import { BIGINT_ZERO } from '../constants';
import {
  omnichainExecutorOwnerAddress,
  omnichainGovernanceOwnerAddress,
} from '../constants/addresses';
import { layerZeroChainId } from '../constants/config';
import { getGovernanceId, getGovernanceRouteId } from '../utilities/ids';

export const getOrCreateFunctionRegistry = (signature: string): FunctionRegistry => {
  let functionRegistry = FunctionRegistry.load(signature);
  if (!functionRegistry) {
    functionRegistry = new FunctionRegistry(signature);
  }
  functionRegistry.save();
  return functionRegistry;
};

export const getOrCreateGovernance = (): Governance => {
  let governance = Governance.load(getGovernanceId());
  if (!governance) {
    governance = new Governance(getGovernanceId());
    governance.address = omnichainGovernanceOwnerAddress;
    governance.executor = omnichainExecutorOwnerAddress;
    governance.layerZeroChainId = layerZeroChainId;
    governance.maxDailyReceiveLimit = BIGINT_ZERO;
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
