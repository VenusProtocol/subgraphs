import { DocumentNode } from 'graphql';
import { Client as UrqlClient, createClient } from 'urql/core';

import {
  AccountByIdDocument,
  AccountFromMarketDocument,
  AccountPositionsDocument,
  MarketPositionByAccountAndMarketDocument,
  MarketPositionByAccountAndMarketQuery,
  MarketPositionByAccountIdDocument,
  MarketPositionsDocument,
  MarketPositionsQuery,
  MarketPositionsWithBorrowByMarketIdDocument,
  MarketPositionsWithBorrowByMarketIdQuery,
  MarketPositionsWithSupplyByMarketIdDocument,
  MarketPositionsWithSupplyByMarketIdQuery,
  MarketActionsDocument,
  MarketByIdDocument,
  MarketByIdQuery,
  MarketsDocument,
  PoolByIdDocument,
  PoolsDocument,
  PoolsQuery,
  RewardsDistributorsDocument,
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
    return result.data;
  }

  async getPools(): Promise<PoolsQuery> {
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
    return result;
  }

  async getAccountById(id: string) {
    const result = await this.query(AccountByIdDocument, { id });
    return result;
  }

  async getMarketPositions({
    first = 100,
    skip = 0,
  }: {
    first: number;
    skip: number;
  }): Promise<MarketPositionsQuery> {
    const result = await this.query(MarketPositionsDocument, { first, skip } as unknown as {
      first: string;
      skip: string;
    });
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

  async getMarketPositionsByAccountId(accountId: string) {
    const result = await this.query(MarketPositionByAccountIdDocument, { accountId });
    return result;
  }

  async getMarketPositionsWithSupplyByMarketId(
    marketId: string,
    page: number,
  ): Promise<MarketPositionsWithSupplyByMarketIdQuery> {
    const first = 100;
    const result = await this.query(MarketPositionsWithSupplyByMarketIdDocument, {
      marketId,
      first,
      skip: first * page,
    } as unknown as {
      marketAddress: string;
      first: string;
      skip: string;
    });
    return result;
  }

  async getMarketPositionsWithBorrowByMarketId(
    marketId: string,
    page: number,
  ): Promise<MarketPositionsWithBorrowByMarketIdQuery> {
    const first = 100;
    const result = await this.query(MarketPositionsWithBorrowByMarketIdDocument, {
      marketId,
      first,
      skip: first * page,
    } as unknown as {
      marketAddress: string;
      first: string;
      skip: string;
    });
    return result;
  }

  async getMarketPositionByAccountAndMarket({
    accountId,
    marketId,
  }: {
    accountId: string;
    marketId: string;
  }): Promise<MarketPositionByAccountAndMarketQuery> {
    const result = await this.query(MarketPositionByAccountAndMarketDocument, {
      id: `${accountId}${marketId.replace('0x', '')}`,
    });
    return result || { MarketPosition: null };
  }

  async getAccountPositions(id: string) {
    const result = await this.query(AccountPositionsDocument, { id });
    return result;
  }
  async getRewardsDistributors() {
    const result = await this.query(RewardsDistributorsDocument, {});
    return result;
  }
}

const createSubgraphClient = (url: string) => new SubgraphClient(url);

export default createSubgraphClient;
