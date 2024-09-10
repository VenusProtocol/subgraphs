import { RoleGranted } from '../../generated/AccessControlManagerV5/AccessControlMangerV5';
import { Permission } from '../../generated/schema';
import { GRANTED, REVOKED } from '../constants';
import { getRoleId } from '../utilities/ids';

export function createOrUpdateRole<E>(event: E): Permission {
  const id = getRoleId(event.params.account, event.params.role);

  let permission = Permission.load(id);
  if (!permission) {
    permission = new Permission(id);
    permission.createdAt = event.transaction.hash;
    permission.role = event.params.role;
    permission.accountAddress = event.params.account;
  }
  permission.status = event instanceof RoleGranted ? GRANTED : REVOKED;
  permission.updatedAt = event.transaction.hash;

  permission.save();

  return permission;
}
