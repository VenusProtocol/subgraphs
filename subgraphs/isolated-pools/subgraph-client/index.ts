import { DocumentNode } from 'graphql';
import { OperationResult, Client as UrqlClient, createClient } from 'urql/core';

import {
  AccountByIdDocument,
  AccountFromMarketDocument,
  AccountPositionsDocument,
  AccountVTokenByAccountAndMarketQueryDocument,
  AccountVTokenByAccountAndMarketQueryQuery,
  AccountVTokenByAccountIdDocument,
  AccountVTokensDocument,
  MarketActionsDocument,
  MarketByIdDocument,
  MarketsDocument,
  PoolByIdDocument,
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

  async query(document: DocumentNode, args: Record<string, string>) {
    const result = await this.urqlClient.query(document, args).toPromise();
    if (result.error) {
      console.error(result.error);
    }
    return result;
  }

  async getPools() {
    const result = await this.query(PoolsDocument, {});
    return result;
  }

  async getPool(id: string) {
    const result = await this.query(PoolByIdDocument, { id });
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

  async getMarketActions() {
    const result = await this.query(MarketActionsDocument, {});
    return result;
  }

  async getAccountFromMarket(marketId: string, accountId: string) {
    const result = await this.query(AccountFromMarketDocument, { marketId, accountId });
    return result;
  }

  async getAccountVTokensByAccountId(accountId: string) {
    const result = await this.query(AccountVTokenByAccountIdDocument, { accountId });
    return result;
  }

  async getAccountVTokenByAccountAndMarket(
    accountId: string,
    marketId: string,
  ): Promise<OperationResult<AccountVTokenByAccountAndMarketQueryQuery>> {
    const result = await this.query(AccountVTokenByAccountAndMarketQueryDocument, {
      accountId,
      marketId,
    });
    return result;
  }

  async getAccountPositions(id: string) {
    const result = await this.query(AccountPositionsDocument, { id });
    return result;
  }
}

export default new SubgraphClient(
  'http://graph-node:8000/subgraphs/name/venusprotocol/venus-isolated-pools',
);
