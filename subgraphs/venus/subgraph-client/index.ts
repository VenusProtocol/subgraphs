import { DocumentNode } from 'graphql';
import { Client as UrqlClient, createClient } from 'urql/core';

import {
  AccountByIdDocument,
  MarketPositionByAccountAndMarketQueryDocument,
  MarketPositionByAccountIdDocument,
  MarketPositionsDocument,
  MarketPositionsWithBorrowByMarketIdDocument,
  MarketPositionsWithBorrowByMarketIdQuery,
  MarketPositionsWithSupplyByMarketIdDocument,
  MarketPositionsWithSupplyByMarketIdQuery,
  ComptrollersDocument,
  ComptrollersQuery,
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
    return result.data;
  }

  async getComptroller(): Promise<{ comptroller: ComptrollersQuery['comptrollers'][number] }> {
    const result = await this.query(ComptrollersDocument, {});
    // For convenience sake of not having to know the id/ address ahead of time
    // and because this subgraph only has one comptroller
    return { comptroller: result.comptrollers[0] };
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

  async getMarketPositions({ first = 25, skip = 0 }: { first: number; skip: number }) {
    const result = await this.query(MarketPositionsDocument, {
      first: first as unknown as string,
      skip: skip as unknown as string,
    });
    return result;
  }

  async getMarketPositionsWithSupplyByMarketId({
    page,
    marketId,
  }: {
    marketId: string;
    page: number;
  }): Promise<MarketPositionsWithSupplyByMarketIdQuery> {
    const first = 100;
    const result = await this.query(MarketPositionsWithSupplyByMarketIdDocument, {
      first,
      skip: first * page,
      marketId,
    } as unknown as {
      marketId: string;
      first: string;
      skip: string;
    });
    return result;
  }

  async getMarketPositionsWithBorrowByMarketId({
    page,
    marketId,
  }: {
    marketId: string;
    page: number;
  }): Promise<MarketPositionsWithBorrowByMarketIdQuery> {
    const first = 100;
    const result = await this.query(MarketPositionsWithBorrowByMarketIdDocument, {
      first,
      skip: first * page,
      marketId,
    } as unknown as {
      marketId: string;
      first: string;
      skip: string;
    });
    return result;
  }

  async getMarketPositionsByAccountId(accountId: string) {
    const result = await this.query(MarketPositionByAccountIdDocument, { accountId });
    return result;
  }

  async getMarketPositionByAccountAndMarket({
    marketId,
    accountId,
  }: {
    marketId: string;
    accountId: string;
  }) {
    const result = await this.query(MarketPositionByAccountAndMarketQueryDocument, {
      id: `${accountId}${marketId.replace('0x', '')}`,
    });
    return result;
  }
}

const createSubgraphClient = (url: string) => new SubgraphClient(url);

export default createSubgraphClient;
