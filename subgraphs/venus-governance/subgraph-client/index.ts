import { DocumentNode } from 'graphql';
import { Client as UrqlClient, createClient } from 'urql/core';

import {
  DelegateByIdDocument,
  DelegatesDocument,
  GovernanceDocument,
  PermissionByIdDocument,
  PermissionsDocument,
  ProposalByIdDocument,
  ProposalsDocument,
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

  async getProposalById(id: string) {
    const result = await this.query(ProposalByIdDocument, { id });
    return result;
  }

  async getDelegateById(id: string) {
    const result = await this.query(DelegateByIdDocument, { id });
    return result;
  }

  async getDelegates() {
    const result = await this.query(DelegatesDocument, {});
    return result;
  }

  async getProposals() {
    const result = await this.query(ProposalsDocument, {});
    return result;
  }

  async getPermissions() {
    const result = await this.query(PermissionsDocument, {});
    return result;
  }

  async getPermission(id: string) {
    const result = await this.query(PermissionByIdDocument, { id });
    return result;
  }

  async getGovernance() {
    const result = await this.query(GovernanceDocument, {});
    return result;
  }
}

export default new SubgraphClient(
  'http://graph-node:8000/subgraphs/name/venusprotocol/venus-governance',
);
