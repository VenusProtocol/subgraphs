import { Address, BigInt } from '@graphprotocol/graph-ts';
import { assert, beforeAll, describe, test } from 'matchstick-as/assembly/index';

import { TokenConverter } from '../../generated/schema';
import {
  handleAssetTransferredToDestination,
  handleBaseAssetUpdated,
  handleConversionConfigUpdated,
  handleConversionEvent,
  handleConversionPaused,
  handleConversionResumed,
  handleConverterNetworkAddressUpdated,
  handleDestinationAddressUpdated,
} from '../../src/mappings/tokenConverter';
import { getTokenConverterId } from '../../src/utilities/ids';
import {
  createBaseAssetUpdatedEvent,
  createConversionConfigUpdatedEvent,
  createConversionPausedEvent,
  createConversionResumedEvent,
  createConverterNetworkAddressUpdatedEvent,
  createConvertedEvent,
  createDestinationAddressUpdatedEvent,
  createAssetTransferredToDestinationEvent,
} from './events';
import { createTokenConverterMock, createTokenMock } from './mocks';

const user = Address.fromString('0x0000000000000000000000000000000000000aaa');
const converterNetworkAddress = Address.fromString('0x0000000000000000000000000000000000000ccc');
const tokenConverter1Address = Address.fromString('0x0000000000000000000000000000000000000111');
const tokenConverter2Address = Address.fromString('0x0000000000000000000000000000000000000222');

const token1Address = Address.fromString('0x000000000000000000000000000000000000c111');
const token2Address = Address.fromString('0x000000000000000000000000000000000000c222');
const token3Address = Address.fromString('0x000000000000000000000000000000000000c333');
const token4Address = Address.fromString('0x000000000000000000000000000000000000c444');

const destination1Address = Address.fromString('0x000000000000000000000000000000000000d111');
const destination2Address = Address.fromString('0x000000000000000000000000000000000000d222');
const priceOracleAddress = Address.fromString('0x000000000000000000000000000000000000abab');

beforeAll(() => {
  createTokenConverterMock(
    tokenConverter1Address,
    destination1Address,
    token3Address,
    priceOracleAddress,
  );
  createTokenConverterMock(
    tokenConverter2Address,
    destination1Address,
    token3Address,
    priceOracleAddress,
  );
  createTokenMock(token1Address, 'BNB');
  createTokenMock(token2Address, 'BTC');
  createTokenMock(token3Address, 'USDC');
  createTokenMock(token4Address, 'ETH');
});

describe('Token Converter', () => {
  test('should index new token converter config', () => {
    handleConversionConfigUpdated(
      createConversionConfigUpdatedEvent(
        tokenConverter1Address,
        token1Address,
        token2Address,
        '200000000000000000',
        '300000000000000000',
        '0',
        '1',
      ),
    );
    const tokenConverterId = getTokenConverterId(tokenConverter1Address).toHexString();

    assert.fieldEquals('TokenConverter', tokenConverterId, 'id', tokenConverterId);
    const tokenConverter = TokenConverter.load(getTokenConverterId(tokenConverter1Address))!;

    const tokenConfigs = tokenConverter.configs.load();
    assert.i32Equals(tokenConfigs.length, 1);
    assert.addressEquals(Address.fromBytes(tokenConfigs[0].tokenIn), token1Address);
    assert.addressEquals(Address.fromBytes(tokenConfigs[0].tokenOut), token2Address);
    assert.stringEquals(tokenConfigs[0].incentive.toString(), '300000000000000000');
    assert.stringEquals(tokenConfigs[0].access, 'ALL');
  });

  test('should index updating existing token converter config', () => {
    handleConversionConfigUpdated(
      createConversionConfigUpdatedEvent(
        tokenConverter1Address,
        token1Address,
        token2Address,
        '300000000000000000',
        '400000000000000000',
        '1',
        '3',
      ),
    );
    const tokenConverterId = getTokenConverterId(tokenConverter1Address).toHexString();
    assert.fieldEquals('TokenConverter', tokenConverterId, 'id', tokenConverterId);

    const tokenConverter = TokenConverter.load(getTokenConverterId(tokenConverter1Address))!;
    const tokenConfigs = tokenConverter.configs.load();
    assert.i32Equals(tokenConfigs.length, 1);
    assert.addressEquals(Address.fromBytes(tokenConfigs[0].tokenIn), token1Address);
    assert.addressEquals(Address.fromBytes(tokenConfigs[0].tokenOut), token2Address);
    assert.stringEquals(tokenConfigs[0].incentive.toString(), '400000000000000000');
    assert.stringEquals(tokenConfigs[0].access, 'ONLY_FOR_USERS');
  });

  test('should index pausing conversions', () => {
    handleConversionPaused(createConversionPausedEvent(tokenConverter1Address, user));
    const tokenConverterId = getTokenConverterId(tokenConverter1Address).toHexString();
    assert.fieldEquals('TokenConverter', tokenConverterId, 'id', tokenConverterId);
    assert.fieldEquals('TokenConverter', tokenConverterId, 'paused', 'true');
  });

  test('should index resuming conversions', () => {
    handleConversionResumed(createConversionResumedEvent(tokenConverter1Address, user));
    const tokenConverterId = getTokenConverterId(tokenConverter1Address).toHexString();
    assert.fieldEquals('TokenConverter', tokenConverterId, 'id', tokenConverterId);
    assert.fieldEquals('TokenConverter', tokenConverterId, 'paused', 'false');
  });

  test('should index updating converter network address', () => {
    const newConverterNetworkAddress = Address.fromString(
      '0x0000000000000000000000000000000000000ddd',
    );
    handleConverterNetworkAddressUpdated(
      createConverterNetworkAddressUpdatedEvent(
        tokenConverter1Address,
        converterNetworkAddress,
        newConverterNetworkAddress,
      ),
    );
    const tokenConverterId = getTokenConverterId(tokenConverter1Address).toHexString();
    assert.fieldEquals('TokenConverter', tokenConverterId, 'id', tokenConverterId);
    assert.fieldEquals(
      'TokenConverter',
      tokenConverterId,
      'converterNetwork',
      newConverterNetworkAddress.toHexString(),
    );
  });

  test('should index updating destination address', () => {
    handleDestinationAddressUpdated(
      createDestinationAddressUpdatedEvent(
        tokenConverter2Address,
        destination1Address,
        destination2Address,
      ),
    );
    const tokenConverterId = getTokenConverterId(tokenConverter2Address).toHexString();
    assert.fieldEquals('TokenConverter', tokenConverterId, 'id', tokenConverterId);
    assert.fieldEquals(
      'TokenConverter',
      tokenConverterId,
      'destinationAddress',
      destination2Address.toHexString(),
    );
  });

  test('should update indexing base asset', () => {
    handleBaseAssetUpdated(
      createBaseAssetUpdatedEvent(tokenConverter2Address, token3Address, token4Address),
    );
    const tokenConverterId = getTokenConverterId(tokenConverter2Address).toHexString();
    assert.fieldEquals('TokenConverter', tokenConverterId, 'id', tokenConverterId);
    assert.fieldEquals(
      'TokenConverter',
      tokenConverterId,
      'baseAsset',
      token4Address.toHexString(),
    );
  });

  test('should handle a "converted" event', () => {
    handleConversionEvent(
      createConvertedEvent(
        tokenConverter2Address,
        user,
        user,
        token1Address,
        token2Address,
        '1',
        '2',
      ),
    );

    const tokenConverter = TokenConverter.load(getTokenConverterId(tokenConverter2Address))!;
    const destinationAmounts = tokenConverter.destinationAmounts.load();
    assert.i32Equals(destinationAmounts.length, 1);
    assert.bigIntEquals(destinationAmounts[0].amount, BigInt.fromString('1'));
    assert.addressEquals(Address.fromBytes(destinationAmounts[0].token), token1Address);
    assert.addressEquals(Address.fromBytes(destinationAmounts[0].address), destination2Address);
    assert.addressEquals(
      Address.fromBytes(destinationAmounts[0].tokenConverter),
      tokenConverter2Address,
    );
  });

  test('should handle an AssetTransferredToDestination event', () => {
    handleAssetTransferredToDestination(
      createAssetTransferredToDestinationEvent(
        tokenConverter2Address,
        destination1Address,
        Address.fromString('0x0000000000000000000000000000000000000bca'),
        token2Address,
        '12345',
      ),
    );

    const tokenConverter = TokenConverter.load(getTokenConverterId(tokenConverter2Address))!;
    const destinationAmounts = tokenConverter.destinationAmounts.load();
    assert.i32Equals(destinationAmounts.length, 2);
    assert.bigIntEquals(destinationAmounts[1].amount, BigInt.fromString('12345'));
    assert.addressEquals(Address.fromBytes(destinationAmounts[1].token), token2Address);
    assert.addressEquals(Address.fromBytes(destinationAmounts[1].address), destination1Address);
    assert.addressEquals(
      Address.fromBytes(destinationAmounts[1].tokenConverter),
      tokenConverter2Address,
    );
  });
});
