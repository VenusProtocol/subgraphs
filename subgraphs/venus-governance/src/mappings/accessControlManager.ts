import { RoleGranted, RoleRevoked } from '../../generated/AccessControlManagerV5/AccessControlMangerV5';
import { createOrUpdateRole } from '../operations/createOrUpdate';

export function handleRoleGranted(event: RoleGranted): void {
  createOrUpdateRole(event);
}

export function handleRoleRevoked(event: RoleRevoked): void {
  createOrUpdateRole(event);
}
