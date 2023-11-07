import { FunctionRegistry, Governance, Timelock } from '../../generated/schema';
import { getGovernanceId, getTimelockId } from '../utilities/ids';

export const getOrCreateFunctionRegistry = (signature: string) => {
  let functionRegistry = FunctionRegistry.load(signature);
  if (!functionRegistry) {
    functionRegistry = new FunctionRegistry(signature);
  }
  return functionRegistry;
};

export const getOrCreateGovernance = () => {
  let governance = Governance.load(getGovernanceId());
  if (!governance) {
    governance = new Governance(getGovernanceId());
    governance.maxDailyReceiveLimit = 0;
    governance.save();
  }
  return governance;
};

export const getOrCreateTimelock = (routeType: i32, timelockAddress: Address) => {
  let timelock = Timelock.load(getTimelockId(routeType));
  if (!timelock) {
    timelock = new Timelock(getTimelockId(routeType));
  }
  timelock.timelockAddress = timelockAddress;
  timelock.save();
};
