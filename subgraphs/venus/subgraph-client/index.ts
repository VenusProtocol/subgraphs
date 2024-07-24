import { DocumentNode } from 'graphql';
import { Client as UrqlClient, createClient } from 'urql/core';

import {
  AccountByIdDocument,
  AccountVTokenByAccountAndMarketQueryDocument,
  AccountVTokenByAccountIdDocument,
  AccountVTokensDocument,
  MarketByIdDocument,
  MarketsDocument,
} from './.graphclient';

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

  async getMarkets() {
    const result = await this.query(MarketsDocument, {});
    return result;
  }

  async getMarketById(id: string) {
    const result = await this.query(MarketByIdDocument, { id });
    return result;
  }

  async getAccountById(id: string) {
    const result = await this.query(AccountByIdDocument, { id });
    return result;
  }

  async getAccountVTokens() {
    const result = await this.query(AccountVTokensDocument, {});
    return result;
  }

  async getAccountVTokensByAccountId(accountId: string) {
    const result = await this.query(AccountVTokenByAccountIdDocument, { accountId });
    return result;
  }

  async getAccountVTokenByAccountAndMarket({
    marketId,
    accountId,
  }: {
    marketId: string;
    accountId: string;
  }) {
    const result = await this.query(AccountVTokenByAccountAndMarketQueryDocument, {
      id: `${marketId}${accountId.replace('0x', '')}`,
    });
    return result;
  }
}

export default new SubgraphClient(
  'http://graph-node:8000/subgraphs/name/venusprotocol/venus-subgraph',
);
