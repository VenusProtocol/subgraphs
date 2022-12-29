import {
  PermissionGranted,
  PermissionRevoked,
} from '../../generated/AccessControlManager/AccessControlManger';
import { createOrUpdatePermissionEvent } from '../operations/createOrUpdate';

export function handlePermissionGranted(event: PermissionGranted): void {
  createOrUpdatePermissionEvent(event);
}

export function handlePermissionRevoked(event: PermissionRevoked): void {
  createOrUpdatePermissionEvent(event);
}
