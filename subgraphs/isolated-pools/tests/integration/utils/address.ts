export const createMockAddressObject = (address: string) =>
  ({
    toHexString: () => address,
  } as any);
