import { DocumentNode } from 'graphql';
import { Client as UrqlClient, createClient } from 'urql/core';

import { TokenConverterConfigsDocument, TokenConverterConfigsQuery } from './.graphclient';

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

  async getTokenConverterConfigs(): Promise<TokenConverterConfigsQuery> {
    const result = await this.query(TokenConverterConfigsDocument, {});
    return result.data;
  }
}

const createSubgraphClient = (url: string) => new SubgraphClient(url);

export default createSubgraphClient;
