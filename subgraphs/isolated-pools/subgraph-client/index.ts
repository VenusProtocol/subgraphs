import { Client as UrqlClient, createClient } from 'urql/core';

import {
  AccountByIdDocument,
  AccountVTokenTransactionsDocument,
  AccountVTokensDocument,
  MarketActionsDocument,
  MarketByIdDocument,
  MarketsDocument,
  PoolsDocument,
} from './.graphclient';

class SubgraphClient {
  urqlClient: UrqlClient;

  constructor(url: string) {
    this.urqlClient = createClient({
      url,
      requestPolicy: 'network-only',
    });
  }

  async getPools() {
    const result = await this.urqlClient.query(PoolsDocument, {}).toPromise();
    return result;
  }

  async getMarkets() {
    const result = await this.urqlClient.query(MarketsDocument, {}).toPromise();
    return result;
  }

  async getMarketById(id: string) {
    const result = await this.urqlClient.query(MarketByIdDocument, { id }).toPromise();
    return result;
  }

  async getAccountById(id: string) {
    const result = await this.urqlClient.query(AccountByIdDocument, { id }).toPromise();
    return result;
  }

  async getAccountVTokens() {
    const result = await this.urqlClient.query(AccountVTokensDocument, {}).toPromise();
    return result;
  }

  async getAccountVTokensTransactions() {
    const result = await this.urqlClient.query(AccountVTokenTransactionsDocument, {}).toPromise();
    return result;
  }

  async getMarketActions() {
    const result = await this.urqlClient.query(MarketActionsDocument, {}).toPromise();
    return result;
  }
}

export default new SubgraphClient(
  'http://127.0.0.1:8000/subgraphs/name/venusprotocol/venus-isolated-pools',
);
