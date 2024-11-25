import { Address } from '@graphprotocol/graph-ts';
import { assert, beforeAll, describe, test } from 'matchstick-as/assembly/index';

import { handleConverterAdded, handleConverterRemoved } from '../../src/mappings/converterNetwork';
import { getConverterNetworkId, getTokenConverterId } from '../../src/utilities/ids';
import { createTokenConverterMock } from '../TokenConverter/mocks';
import { createConverterAddedEvent, createConverterRemovedEvent } from './events';

const converterNetworkAddress = Address.fromString('0x0000000000000000000000000000000000000ccc');
const tokenConverter1Address = Address.fromString('0x0000000000000000000000000000000000000111');
const tokenConverter2Address = Address.fromString('0x0000000000000000000000000000000000000222');

const token1Address = Address.fromString('0x000000000000000000000000000000000000c111');
const destination1Address = Address.fromString('0x000000000000000000000000000000000000d111');
const priceOracleAddress = Address.fromString('0x000000000000000000000000000000000000abab');

beforeAll(() => {
  createTokenConverterMock(
    tokenConverter1Address,
    destination1Address,
    token1Address,
    priceOracleAddress,
  );
  createTokenConverterMock(
    tokenConverter2Address,
    destination1Address,
    token1Address,
    priceOracleAddress,
  );
});

describe('Converter Network', () => {
  test('should index adding token converter', () => {
    const converterAddedEvent = createConverterAddedEvent(
      converterNetworkAddress,
      tokenConverter1Address,
    );

    handleConverterAdded(converterAddedEvent);

    const converterNetworkId = getConverterNetworkId(converterNetworkAddress);
    const tokenConverterId = getTokenConverterId(tokenConverter1Address).toHexString();
    assert.fieldEquals('TokenConverter', tokenConverterId, 'id', tokenConverterId);
    assert.fieldEquals(
      'TokenConverter',
      tokenConverterId,
      'converterNetwork',
      converterNetworkId.toHexString(),
    );
  });

  test('should index removing token converter', () => {
    const tokenConverterId = getTokenConverterId(tokenConverter2Address).toHexString();
    const converterNetworkId = getConverterNetworkId(converterNetworkAddress).toHexString();
    const converterAddedEvent = createConverterAddedEvent(
      converterNetworkAddress,
      tokenConverter2Address,
    );

    handleConverterAdded(converterAddedEvent);

    assert.fieldEquals('TokenConverter', tokenConverterId, 'id', tokenConverterId);
    assert.fieldEquals('TokenConverter', tokenConverterId, 'converterNetwork', converterNetworkId);

    const converterRemovedEvent = createConverterRemovedEvent(
      converterNetworkAddress,
      tokenConverter2Address,
    );

    handleConverterRemoved(converterRemovedEvent);

    assert.fieldEquals('TokenConverter', tokenConverterId, 'id', tokenConverterId);
    assert.fieldEquals('TokenConverter', tokenConverterId, 'converterNetwork', 'null');
  });
});
