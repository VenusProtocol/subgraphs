export const queryMarketById = (id: string) => `
  {
    market(id: "${id}") {
      id
    }
  }
`;
