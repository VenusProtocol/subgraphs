import { afterEach, assert, clearStore, describe, test } from 'matchstick-as/assembly/index';

import { PermissionGranted, PermissionRevoked } from '../../generated/AccessControlManager/AccessControlManger';
import { GRANTED, REVOKED } from '../../src/constants';
import { handlePermissionGranted, handlePermissionRevoked } from '../../src/mappings/accessControlManager';
import { getPermissionId } from '../../src/utilities/ids';
import { mockContractAddress, mockFunctionSig, user1 } from './constants';
import { createPermission } from './events';

const cleanup = (): void => {
  clearStore();
};

afterEach(() => {
  cleanup();
});

describe('Permission events', () => {
  test('handles permission granted event', () => {
    const permissionGrantedEvent = createPermission<PermissionGranted>(user1, mockContractAddress, mockFunctionSig);
    handlePermissionGranted(permissionGrantedEvent);

    const assertPermissionGrantedDocument = (key: string, value: string): void => {
      const id = getPermissionId(user1, mockContractAddress, mockFunctionSig);
      assert.fieldEquals('Permission', id.toHex(), key, value);
    };

    assertPermissionGrantedDocument('status', GRANTED);
    assertPermissionGrantedDocument('accountAddress', user1.toHexString());
    assertPermissionGrantedDocument('contractAddress', mockContractAddress.toHexString());
    assertPermissionGrantedDocument('functionSignature', mockFunctionSig);
  });

  test('handles permission revoked', () => {
    const permissionRevokedEvent = createPermission<PermissionRevoked>(user1, mockContractAddress, mockFunctionSig);
    handlePermissionRevoked(permissionRevokedEvent);

    const assertPermissionRevokedDocument = (key: string, value: string): void => {
      const id = getPermissionId(user1, mockContractAddress, mockFunctionSig);
      assert.fieldEquals('Permission', id.toHex(), key, value);
    };

    assertPermissionRevokedDocument('status', REVOKED);
    assertPermissionRevokedDocument('accountAddress', user1.toHexString());
    assertPermissionRevokedDocument('contractAddress', mockContractAddress.toHexString());
    assertPermissionRevokedDocument('functionSignature', mockFunctionSig);
  });

  test('handles updating a previously granted permission record', () => {
    const permissionGrantedEvent = createPermission<PermissionGranted>(user1, mockContractAddress, mockFunctionSig);
    handlePermissionGranted(permissionGrantedEvent);

    const assertPermissionGrantedDocument = (key: string, value: string): void => {
      const id = getPermissionId(user1, mockContractAddress, mockFunctionSig);
      assert.fieldEquals('Permission', id.toHex(), key, value);
    };

    assertPermissionGrantedDocument('status', GRANTED);
    assertPermissionGrantedDocument('accountAddress', user1.toHexString());
    assertPermissionGrantedDocument('contractAddress', mockContractAddress.toHexString());
    assertPermissionGrantedDocument('functionSignature', mockFunctionSig);

    const permissionRevokedEvent = createPermission<PermissionRevoked>(user1, mockContractAddress, mockFunctionSig);
    handlePermissionRevoked(permissionRevokedEvent);

    const assertPermissionRevokedDocument = (key: string, value: string): void => {
      const id = getPermissionId(user1, mockContractAddress, mockFunctionSig);
      assert.fieldEquals('Permission', id.toHex(), key, value);
    };

    assertPermissionRevokedDocument('status', REVOKED);
    assertPermissionRevokedDocument('accountAddress', user1.toHexString());
    assertPermissionRevokedDocument('contractAddress', mockContractAddress.toHexString());
    assertPermissionRevokedDocument('functionSignature', mockFunctionSig);
  });
});
