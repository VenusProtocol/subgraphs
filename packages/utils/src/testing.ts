import assert from 'assert';

export const assertEqual = (
  entity: any,
  contractValue: any,
  key: string,
  transform?: (val: any) => any,
) => {
  const subgraphValue = transform ? transform(entity[key]) : entity[key]?.toString();
  try {
    assert.equal(
      contractValue?.toString(),
      subgraphValue,
      `
      ${key} incorrect on ${
        entity.id
      } Contract: ${contractValue?.toString()}; Subgraph: ${subgraphValue};`,
    );
  } catch (e) {
    console.error(e.message);
  }
};

export const tryCall = async (func: () => any, defaultValue: any) => {
  try {
    return await func();
  } catch (e) {
    console.log('function call failed');
  }
  return defaultValue;
};
