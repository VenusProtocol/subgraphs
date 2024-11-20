import { PermissionGranted } from '../../generated/AccessControlManager/AccessControlManger';
import { Permission } from '../../generated/schema';
import { GRANTED, REVOKED } from '../constants';
import { getPermissionId } from '../utilities/ids';

export function createOrUpdatePermission<E>(event: E): Permission {
  const id = getPermissionId(event.params.account, event.params.contractAddress, event.params.functionSig);
  let permission = Permission.load(id);
  if (!permission) {
    permission = new Permission(id);
    permission.accountAddress = event.params.account;
    permission.contractAddress = event.params.contractAddress;
    permission.functionSignature = event.params.functionSig;
    permission.createdAt = event.transaction.hash;
  }
  permission.updatedAt = event.transaction.hash;
  permission.status = event instanceof PermissionGranted ? GRANTED : REVOKED;
  permission.save();

  return permission;
}
