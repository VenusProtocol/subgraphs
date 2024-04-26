import { DocumentNode } from 'graphql';
import { Client as UrqlClient, createClient } from 'urql/core';

import { AccountsDocument } from './.graphclient';

class SubgraphClient {
  urqlClient: UrqlClient;

  constructor(url: string) {
    this.urqlClient = createClient({
      url,
      requestPolicy: 'network-only',
    });
  }

  async query(document: DocumentNode, args: Record<string, string>) {
    const result = await this.urqlClient.query(document, args).toPromise();
    if (result.error) {
      console.error(result.error);
    }
    return result;
  }

  async getAccounts() {
    const result = await this.query(AccountsDocument, {});
    return result;
  }
}

export default new SubgraphClient(
  'http://127.0.0.1:8000/subgraphs/name/venusprotocol/etherfi-promo',
);
