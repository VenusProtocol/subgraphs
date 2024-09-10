export const numberToByteId = (num: number) => {
  const hex = num.toString(16);
  return `0x${hex.padEnd(8, '0')}`;
};
