import { Address, Bytes } from '@graphprotocol/graph-ts';

export const user1 = Address.fromString('0x0000000000000000000000000000000000000101');
export const user2 = Address.fromString('0x0000000000000000000000000000000000000202');
export const user3 = Address.fromString('0x0000000000000000000000000000000000000303');

export const mockRole = Bytes.fromHexString('0x611a2749915766fd36ec1ee3a34749468d30b9e44a677e423124856ac4947231');

// Mocked Governor return values
export const mockImplementationAddress = Address.fromString('0x000000000000000000000000000000000000c0DE');
export const mockAdminAddress = Address.fromString('0x000000000000000000000000000000000000ad53');
export const mockGuardianAddress = Address.fromString('0x000000000000000000000000000000000000536d');
export const timelockAddress0 = Address.fromString('0x0000000000000000000000000000000000070c50');
export const timelockAddress1 = Address.fromString('0x0000000000000000000000000000000000070c51');
export const timelockAddress2 = Address.fromString('0x0000000000000000000000000000000000070c52');

export const mockXvsAddress = Address.fromString('0x00000000000000000000000000000000000003c5');
