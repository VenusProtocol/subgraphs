import { PermissionGranted, PermissionRevoked } from '../../generated/AccessControlManager/AccessControlManger';
import { createOrUpdatePermission } from '../operations/createOrUpdate';

export function handlePermissionGranted(event: PermissionGranted): void {
  createOrUpdatePermission(event);
}

export function handlePermissionRevoked(event: PermissionRevoked): void {
  createOrUpdatePermission(event);
}
