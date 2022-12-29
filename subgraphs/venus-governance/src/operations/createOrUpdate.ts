import { PermissionGranted } from '../../generated/AccessControlManager/AccessControlManger';
import { PermissionEvent } from '../../generated/schema';
import { GRANTED, REVOKED } from '../constants';
import { getPermissionEventId } from '../utils/ids';

export function createOrUpdatePermissionEvent<E>(event: E): PermissionEvent {
  const id = getPermissionEventId(
    event.params.account,
    event.params.contractAddress,
    event.params.functionSig,
  );
  let permissionEvent = PermissionEvent.load(id);
  if (!permissionEvent) {
    permissionEvent = new PermissionEvent(id);
  }
  permissionEvent.type = event instanceof PermissionGranted ? GRANTED : REVOKED;
  permissionEvent.account = event.params.account;
  permissionEvent.contractAddress = event.params.contractAddress;
  permissionEvent.functionSig = event.params.functionSig;

  permissionEvent.save();

  return permissionEvent;
}
