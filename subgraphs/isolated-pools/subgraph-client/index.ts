import { DocumentNode } from 'graphql';
import { Client as UrqlClient, createClient } from 'urql/core';

import {
  AccountByIdDocument,
  AccountFromMarketDocument,
  AccountPositionsDocument,
  AccountVTokenByAccountAndMarketDocument,
  AccountVTokenByAccountAndMarketQuery,
  AccountVTokenByAccountIdDocument,
  AccountVTokensDocument,
  AccountVTokensQuery,
  AccountVTokensWithBorrowByMarketIdDocument,
  AccountVTokensWithSupplyByMarketIdDocument,
  AccountVTokensWithSupplyByMarketIdQuery,
  MarketActionsDocument,
  MarketByIdDocument,
  MarketByIdQuery,
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

  async getMarketById(id: string): Promise<MarketByIdQuery> {
    const result = await this.query(MarketByIdDocument, { id });
    return result.data;
  }

  async getAccountById(id: string) {
    const result = await this.query(AccountByIdDocument, { id });
    return result;
  }

  async getAccountVTokens(): Promise<AccountVTokensQuery> {
    const result = await this.query(AccountVTokensDocument, {});
    return result.data;
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

  async getAccountVTokensWithSupplyByMarketId(marketId: string): Promise<AccountVTokensWithSupplyByMarketIdQuery> {
    const result = await this.query(AccountVTokensWithSupplyByMarketIdDocument, { marketId });
    return result.data;
  }

  async getAccountVTokensWithBorrowByMarketId(marketId: string): Promise<AccountVTokensWithBorrowByMarketId> {
    const result = await this.query(AccountVTokensWithBorrowByMarketIdDocument, { marketId });
    return result.data;
  }

  async getAccountVTokenByAccountAndMarket({ accountId, marketId }: { accountId: string; marketId: string }): Promise<AccountVTokenByAccountAndMarketQuery> {
    const result = await this.query(AccountVTokenByAccountAndMarketDocument, {
      id: `${marketId}${accountId.replace('0x', '')}`,
    });
    return result.data || { accountVToken: null };
  }

  async getAccountPositions(id: string) {
    const result = await this.query(AccountPositionsDocument, { id });
    return result;
  }
}

export default new SubgraphClient('http://graph-node:8000/subgraphs/name/venusprotocol/venus-isolated-pools');
