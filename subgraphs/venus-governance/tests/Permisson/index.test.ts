import { afterEach, assert, clearStore, describe, test } from 'matchstick-as/assembly/index';

import {
  PermissionGranted,
  PermissionRevoked,
} from '../../generated/AccessControlManager/AccessControlManger';
import { GRANTED, REVOKED } from '../../src/constants';
import {
  handlePermissionGranted,
  handlePermissionRevoked,
} from '../../src/mappings/accessControlManager';
import { getPermissionId } from '../../src/utils/ids';
import { mockContractAddress, mockFunctionSig, user1 } from '../common/constants';
import { createPermission } from '../common/events';

const cleanup = (): void => {
  clearStore();
};

afterEach(() => {
  cleanup();
});

describe('Permission events', () => {
  test('handles permission granted event', () => {
    const permissionGrantedEvent = createPermission<PermissionGranted>(
      user1,
      mockContractAddress,
      mockFunctionSig,
    );
    handlePermissionGranted(permissionGrantedEvent);

    const assertPermissionGrantedDocument = (key: string, value: string): void => {
      const id = getPermissionId(user1, mockContractAddress, mockFunctionSig);
      assert.fieldEquals('Permission', id, key, value);
    };

    assertPermissionGrantedDocument('type', GRANTED);
    assertPermissionGrantedDocument('account', user1.toHexString());
    assertPermissionGrantedDocument('contractAddress', mockContractAddress.toHexString());
    assertPermissionGrantedDocument('functionSig', mockFunctionSig);
  });

  test('handles permission revoked', () => {
    const permissionRevokedEvent = createPermission<PermissionRevoked>(
      user1,
      mockContractAddress,
      mockFunctionSig,
    );
    handlePermissionRevoked(permissionRevokedEvent);

    const assertPermissionRevokedDocument = (key: string, value: string): void => {
      const id = getPermissionId(user1, mockContractAddress, mockFunctionSig);
      assert.fieldEquals('Permission', id, key, value);
    };

    assertPermissionRevokedDocument('type', REVOKED);
    assertPermissionRevokedDocument('account', user1.toHexString());
    assertPermissionRevokedDocument('contractAddress', mockContractAddress.toHexString());
    assertPermissionRevokedDocument('functionSig', mockFunctionSig);
  });

  test('handles updating a previously granted permission record', () => {
    const permissionGrantedEvent = createPermission<PermissionGranted>(
      user1,
      mockContractAddress,
      mockFunctionSig,
    );
    handlePermissionGranted(permissionGrantedEvent);

    const assertPermissionGrantedDocument = (key: string, value: string): void => {
      const id = getPermissionId(user1, mockContractAddress, mockFunctionSig);
      assert.fieldEquals('Permission', id, key, value);
    };

    assertPermissionGrantedDocument('type', GRANTED);
    assertPermissionGrantedDocument('account', user1.toHexString());
    assertPermissionGrantedDocument('contractAddress', mockContractAddress.toHexString());
    assertPermissionGrantedDocument('functionSig', mockFunctionSig);

    const permissionRevokedEvent = createPermission<PermissionRevoked>(
      user1,
      mockContractAddress,
      mockFunctionSig,
    );
    handlePermissionRevoked(permissionRevokedEvent);

    const assertPermissionRevokedDocument = (key: string, value: string): void => {
      const id = getPermissionId(user1, mockContractAddress, mockFunctionSig);
      assert.fieldEquals('Permission', id, key, value);
    };

    assertPermissionRevokedDocument('type', REVOKED);
    assertPermissionRevokedDocument('account', user1.toHexString());
    assertPermissionRevokedDocument('contractAddress', mockContractAddress.toHexString());
    assertPermissionRevokedDocument('functionSig', mockFunctionSig);
  });
});
