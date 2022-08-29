import '@nomiclabs/hardhat-ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ApolloFetch, FetchResult } from 'apollo-fetch';
import fs from 'fs';
import Mustache from 'mustache';

// Queries
import { queryTokenHolderById } from './queries';
// eslint-disable-line @typescript-eslint/no-var-requires
// Utils
import { exec, fetchSubgraph, waitForSubgraphToBeSynced } from './utils';

const { ethers } = require('hardhat'); // eslint-disable-line @typescript-eslint/no-var-requires

// Subgraph Name
const subgraphUser = 'venusprotocol';
const subgraphName = 'venus-isolated-pools';

// Test
describe('Token', function () {
  let subgraph: ApolloFetch;
  let signers: SignerWithAddress[];

  const syncDelay = 2000;

  before(async function () {
    this.timeout(50000); // sometimes it takes a long time

    signers = await ethers.getSigners();

    // Read yaml template
    const yamlTemplate = await fs.promises.readFile(`${__dirname}/../template.yaml`, 'binary');
    if (yamlTemplate) {
      const renderedTemplate = Mustache.render(yamlTemplate, {});
      await fs.writeFileSync(`${__dirname}/../subgraph.yaml`, renderedTemplate);
    } else {
      throw Error('Unable to write subgraph.yaml from template');
    }

    // Create Subgraph Connection
    subgraph = fetchSubgraph(subgraphUser, subgraphName);

    // Build and Deploy Subgraph
    console.log('Build and deploy subgraph...');
    // exec(`npx hardhat compile`);
    exec(`yarn workspace isolated-pools-subgraph run codegen`);
    exec(`yarn workspace isolated-pools-subgraph run build:local`);
    exec(`yarn workspace isolated-pools-subgraph run create:local`);
    exec(`yarn workspace isolated-pools-subgraph run deploy:local`);

    await waitForSubgraphToBeSynced(syncDelay);
  });

  after(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`);

    process.stdout.write('Clean up complete.');
  });

  it('indexes token transfers', async function () {
    const recipient = await signers[1].getAddress();

    await waitForSubgraphToBeSynced(syncDelay);

    const query = await queryTokenHolderById(recipient);
    const response = (await subgraph({ query })) as FetchResult;
    console.log({ response });
  });
});
