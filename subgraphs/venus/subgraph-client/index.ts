import { DocumentNode } from 'graphql';
import { Client as UrqlClient, createClient } from 'urql/core';

import {
  AccountByIdDocument,
  AccountVTokenByAccountAndMarketQueryDocument,
  AccountVTokenByAccountIdDocument,
  AccountVTokensDocument,
  AccountVTokensWithBorrowByMarketIdDocument,
  AccountVTokensWithBorrowByMarketIdQuery,
  AccountVTokensWithSupplyByMarketIdDocument,
  AccountVTokensWithSupplyByMarketIdQuery,
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
    return result;
  }

  async getComptroller(): Promise<{ comptroller: ComptrollersQuery['comptrollers'][number] }> {
    const result = await this.query(ComptrollersDocument, {});
    // For convenience sake of not having to know the id/ address ahead of time
    // and because this subgraph only has one comptroller
    return { comptroller: result.data.comptrollers[0] };
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

  async getAccountVTokens({ first = 25, skip = 0 }: { first: number; skip: number }) {
    const result = await this.query(AccountVTokensDocument, {
      first: first as unknown as string,
      skip: skip as unknown as string,
    });
    return result;
  }

  async getAccountVTokensWithSupplyByMarketId({
    first,
    skip,
    marketId,
  }: {
    marketId: string;
    first: number;
    skip: number;
  }): Promise<AccountVTokensWithSupplyByMarketIdQuery> {
    const result = await this.query(AccountVTokensWithSupplyByMarketIdDocument, {
      first: first as unknown as string,
      skip: skip as unknown as string,
      marketId,
    });
    return result.data;
  }

  async getAccountVTokensWithBorrowByMarketId({
    first,
    skip,
    marketId,
  }: {
    marketId: string;
    first: number;
    skip: number;
  }): Promise<AccountVTokensWithBorrowByMarketIdQuery> {
    const result = await this.query(AccountVTokensWithBorrowByMarketIdDocument, {
      first: first as unknown as string,
      skip: skip as unknown as string,
      marketId,
    });
    return result.data;
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

const createSubgraphClient = (url: string) => new SubgraphClient(url);

export default createSubgraphClient;
