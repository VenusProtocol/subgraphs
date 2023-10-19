import { Client as UrqlClient, createClient } from 'urql/core';

import {
  DelegateByIdDocument,
  DelegatesDocument,
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

  async getProposalById(id: string) {
    const result = await this.urqlClient.query(ProposalByIdDocument, { id: id }).toPromise();
    return result;
  }

  async getDelegateById(id: string) {
    const result = await this.urqlClient.query(DelegateByIdDocument, { id: id }).toPromise();
    return result;
  }

  async getDelegates() {
    const result = await this.urqlClient.query(DelegatesDocument, {}).toPromise();
    return result;
  }

  async getProposals() {
    const result = await this.urqlClient.query(ProposalsDocument, {}).toPromise();
    return result;
  }

  async getPermissions() {
    const result = await this.urqlClient.query(PermissionsDocument, {}).toPromise();
    return result;
  }
}

export default new SubgraphClient(
  'http://graph-node:8000/subgraphs/name/venusprotocol/venus-governance',
);
