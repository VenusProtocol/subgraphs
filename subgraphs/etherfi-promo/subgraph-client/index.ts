import { DocumentNode } from 'graphql';
import { OperationResult, Client as UrqlClient, createClient } from 'urql/core';

import { AccountsDocument, AccountsQuery } from './.graphclient';

class SubgraphClient {
  urqlClient: UrqlClient;

  constructor(url: string) {
    this.urqlClient = createClient({
      url,
      requestPolicy: 'network-only',
    });
  }

  async query(document: DocumentNode, args: Record<string, string | number>) {
    const result = await this.urqlClient.query(document, args).toPromise();
    if (result.error) {
      console.error(result.error);
    }
    return result;
  }

  async getAccounts(
    blockNumber: number,
    token: string,
    tokenId: string,
  ): Promise<OperationResult<AccountsQuery>> {
    const result = await this.query(AccountsDocument, {
      blockNumber,
      token: token.toLowerCase(),
      tokenId: tokenId.toLowerCase(),
    });
    return result;
  }
}

export default new SubgraphClient(
  'http://127.0.0.1:8000/subgraphs/name/venusprotocol/etherfi-promo',
);
