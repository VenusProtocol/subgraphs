import { afterEach, assert, clearStore, describe, test } from 'matchstick-as/assembly/index';

import { RoleGranted, RoleRevoked } from '../../../generated/AccessControlManagerV5/AccessControlMangerV5';
import { GRANTED, REVOKED } from '../../../src/constants';
import { handleRoleGranted, handleRoleRevoked } from '../../../src/mappings/accessControlManager';
import { getRoleId } from '../../../src/utilities/ids';
import { mockRole, user1 } from '../../common/constants';
import { createRole } from '../../common/events';

const cleanup = (): void => {
  clearStore();
};

afterEach(() => {
  cleanup();
});

describe('Role events', () => {
  test('handles permission granted event', () => {
    const permissionGrantedEvent = createRole<RoleGranted>(user1, mockRole);
    handleRoleGranted(permissionGrantedEvent);

    const assertRoleGrantedDocument = (key: string, value: string): void => {
      const id = getRoleId(user1, mockRole);
      assert.fieldEquals('Permission', id.toHexString(), key, value);
    };

    assertRoleGrantedDocument('status', GRANTED);
    assertRoleGrantedDocument('accountAddress', user1.toHexString());
    assertRoleGrantedDocument('role', mockRole.toHexString());
  });

  test('handles permission revoked', () => {
    const permissionRevokedEvent = createRole<RoleRevoked>(user1, mockRole);
    handleRoleRevoked(permissionRevokedEvent);

    const assertRoleRevokedDocument = (key: string, value: string): void => {
      const id = getRoleId(user1, mockRole);
      assert.fieldEquals('Permission', id.toHexString(), key, value);
    };

    assertRoleRevokedDocument('status', REVOKED);
    assertRoleRevokedDocument('accountAddress', user1.toHexString());
    assertRoleRevokedDocument('role', mockRole.toHexString());
  });

  test('handles updating a previously granted permission record', () => {
    const permissionGrantedEvent = createRole<RoleGranted>(user1, mockRole);
    handleRoleGranted(permissionGrantedEvent);

    const assertRoleGrantedDocument = (key: string, value: string): void => {
      const id = getRoleId(user1, mockRole);
      assert.fieldEquals('Permission', id.toHexString(), key, value);
    };

    assertRoleGrantedDocument('status', GRANTED);
    assertRoleGrantedDocument('accountAddress', user1.toHexString());
    assertRoleGrantedDocument('role', mockRole.toHexString());

    const permissionRevokedEvent = createRole<RoleRevoked>(user1, mockRole);
    handleRoleRevoked(permissionRevokedEvent);

    const assertRoleRevokedDocument = (key: string, value: string): void => {
      const id = getRoleId(user1, mockRole);
      assert.fieldEquals('Permission', id.toHex(), key, value);
    };

    assertRoleRevokedDocument('status', REVOKED);
    assertRoleRevokedDocument('accountAddress', user1.toHexString());
    assertRoleRevokedDocument('role', mockRole.toHexString());
  });
});
