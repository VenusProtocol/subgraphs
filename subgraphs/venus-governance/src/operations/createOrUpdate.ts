import { PermissionGranted } from '../../generated/AccessControlManager/AccessControlManger';
import { RoleGranted } from '../../generated/AccessControlManagerV5/AccessControlMangerV5';
import { Permission } from '../../generated/schema';
import { GRANTED, REVOKED } from '../constants';
import { getPermissionId, getRoleId } from '../utilities/ids';

export function createOrUpdatePermission<E>(event: E): Permission {
  const id = getPermissionId(
    event.params.account,
    event.params.contractAddress,
    event.params.functionSig,
  );
  let permission = Permission.load(id);
  if (!permission) {
    permission = new Permission(id);
  }
  permission.status = event instanceof PermissionGranted ? GRANTED : REVOKED;
  permission.account = event.params.account;
  permission.contractAddress = event.params.contractAddress;
  permission.functionSig = event.params.functionSig;

  permission.save();

  return permission;
}

export function createOrUpdateRole<E>(event: E): Permission {
  const id = getRoleId(event.params.role, event.params.account, event.params.sender);

  let permission = Permission.load(id);
  if (!permission) {
    permission = new Permission(id);
  }
  permission.status = event instanceof RoleGranted ? GRANTED : REVOKED;
  permission.account = event.params.account;
  permission.contractAddress = event.params.sender;
  permission.functionSig = event.params.role.toHexString();

  permission.save();

  return permission;
}
