interface TokenHoldertype {
  id: string;
  tokenBalanceRaw: string;
}
export interface SubgraphResponseType {
  tokenHolder: TokenHoldertype;
}
