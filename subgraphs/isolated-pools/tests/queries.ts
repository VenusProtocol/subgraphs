export const queryTokenHolderById = (id: string) => `
{
    tokenHolder(id: "${id}") {
      id
      tokenBalanceRaw
    }
  }
  `;
