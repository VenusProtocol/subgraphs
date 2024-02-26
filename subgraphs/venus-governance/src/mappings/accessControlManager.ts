import {
  PermissionGranted,
  PermissionRevoked,
} from '../../generated/AccessControlManager/AccessControlManger';
import {
  RoleGranted,
  RoleRevoked,
} from '../../generated/AccessControlManagerV5/AccessControlMangerV5';
import { createOrUpdatePermission, createOrUpdateRole } from '../operations/createOrUpdate';

export function handlePermissionGranted(event: PermissionGranted): void {
  createOrUpdatePermission(event);
}

export function handlePermissionRevoked(event: PermissionRevoked): void {
  createOrUpdatePermission(event);
}

export function handleRoleGranted(event: RoleGranted): void {
  createOrUpdateRole(event);
}

export function handleRoleRevoked(event: RoleRevoked): void {
  createOrUpdateRole(event);
}
