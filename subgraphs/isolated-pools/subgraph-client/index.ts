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
  AccountVTokensWithBorrowByMarketIdQuery,
  AccountVTokensWithSupplyByMarketIdDocument,
  AccountVTokensWithSupplyByMarketIdQuery,
  MarketActionsDocument,
  MarketByIdDocument,
  MarketByIdQuery,
  MarketsDocument,
  PoolByIdDocument,
  PoolsDocument,
  PoolsQuery,
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

  async getPools(): Promise<PoolsQuery> {
    const result = await this.query(PoolsDocument, {});
    return result.data;
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

  async getAccountVTokens({
    first = 100,
    skip = 0,
  }: {
    first: number;
    skip: number;
  }): Promise<AccountVTokensQuery> {
    const result = await this.query(AccountVTokensDocument, { first, skip } as unknown as {
      first: string;
      skip: string;
    });
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

  async getAccountVTokensWithSupplyByMarketId(
    marketId: string,
  ): Promise<AccountVTokensWithSupplyByMarketIdQuery> {
    const result = await this.query(AccountVTokensWithSupplyByMarketIdDocument, { marketId });
    return result.data;
  }

  async getAccountVTokensWithBorrowByMarketId(
    marketId: string,
  ): Promise<AccountVTokensWithBorrowByMarketIdQuery> {
    const result = await this.query(AccountVTokensWithBorrowByMarketIdDocument, { marketId });
    return result.data;
  }

  async getAccountVTokenByAccountAndMarket({
    accountId,
    marketId,
  }: {
    accountId: string;
    marketId: string;
  }): Promise<AccountVTokenByAccountAndMarketQuery> {
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

const createSubgraphClient = (url: string) => new SubgraphClient(url);

export default createSubgraphClient;
