import '@nomiclabs/hardhat-ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ApolloFetch, FetchResult } from 'apollo-fetch';
import { expect } from 'chai';
import { Contract } from 'ethers';
import fs from 'fs';
import { ethers } from 'hardhat';
import Mustache from 'mustache';
import {
  deployAndConfigureXvsVault,
  deployGovernorAlpha,
  deployGovernorAlpha2,
  deployGovernorBravoDelegate,
  deployGovernorBravoDelegator,
} from 'venus-protocol/script/hardhat';

// Queries
import { queryProposalById } from './queries';
import { normalizeMantissa } from './utils/math';
// Utils
import { exec, fetchSubgraph, waitForSubgraphToBeSynced } from './utils/subgraph';
import { enfranchiseAccount } from './utils/voter';

// Subgraph Name
const subgraphUser = 'venusprotocol';
const subgraphName = 'venus-governance';

// Test
describe('Token', function () {
  let subgraph: ApolloFetch;
  let signers: SignerWithAddress[];
  let governorAlpha: Contract;
  let governorAlpha2: Contract;
  let governorBravoDelegate: Contract;
  let xvs: Contract;
  let xvsVault: Contract;

  const syncDelay = 2000;
  before(async function () {
    this.timeout(50000); // sometimes it takes a long time

    const guardianAddress = '0x0000000000000000000000000000000000000101';

    const contracts = await deployAndConfigureXvsVault();
    ({ xvs, xvsVault } = contracts);
    const { timelock } = contracts;
    const xvsAddress = xvs.address;
    const timelockAddress = timelock.address;
    const xvsVaultAddress = xvsVault.address;

    governorAlpha = await deployGovernorAlpha({
      timelockAddress,
      xvsVaultAddress,
      guardianAddress,
    });
    const governorAlphaAddress = governorAlpha.address;

    governorAlpha2 = await deployGovernorAlpha2({
      timelockAddress,
      xvsVaultAddress,
      guardianAddress,
      lastProposalId: 20,
    });
    const governorAlpha2Address = governorAlpha2.address;

    governorBravoDelegate = await deployGovernorBravoDelegate();
    const governorBravoDelegateAddress = governorBravoDelegate.address;

    await deployGovernorBravoDelegator({
      timelockAddress,
      xvsVaultAddress,
      guardianAddress,
      governorBravoDelegateAddress,
    });

    signers = await ethers.getSigners();

    // Read yaml template
    const yamlTemplate = await fs.promises.readFile(`${__dirname}/../../template.yaml`, 'binary');
    if (yamlTemplate) {
      const templateValues = {
        governorAlphaAddress,
        governorAlpha2Address,
        governorBravoDelegateAddress,
        venusTokenAddress: xvsAddress,
        xvsVaultAddress,
        governorAlphaStartBlock: 0,
        governorAlpha2StartBlock: 0,
        governorBravoDelegateBlock: 0,
        governorBravoDelegateStartBlock: 0,
        venusTokenStartBlock: 0,
        xvsVaultStartBlock: 0,
        network: 'bsc',
      };
      console.log('writing subgraph.yaml', templateValues);
      const renderedTemplate = Mustache.render(yamlTemplate, templateValues);
      await fs.writeFileSync(`${__dirname}/../../subgraph.yaml`, renderedTemplate);
    } else {
      throw Error('Unable to write subgraph.yaml from template');
    }

    // Create Subgraph Connection
    subgraph = fetchSubgraph(subgraphUser, subgraphName);

    // Build and Deploy Subgraph
    console.log('Build and deploy subgraph...');

    exec('yarn workspace venus-governance run codegen');
    exec('yarn workspace venus-governance run create:local');
    exec(`yarn workspace venus-governance run deploy:local -l ${Date.now().toString()}`);

    await waitForSubgraphToBeSynced(syncDelay);
  });

  after(async function () {
    process.stdout.write('Clean up, removing subgraph....');

    exec(`yarn remove:local`);

    process.stdout.write('Clean up complete.');
  });

  it('indexes created proposals - alpha', async function () {
    const [_, user1] = signers; // eslint-disable-line @typescript-eslint/no-unused-vars
    await enfranchiseAccount(xvs, xvsVault, user1, normalizeMantissa(40e4, 1e18));

    const callData = ethers.utils.defaultAbiCoder.encode(['address'], [governorAlpha.address]);

    const vip = [
      ['0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'], // targets
      ['0'], // values
      ['setPendingAdmin(address)'], // signatures
      [callData], // params
      'Test proposal 1', // description
    ];

    const tx = await governorAlpha.connect(user1).propose(...vip);
    await tx.wait(1);

    await waitForSubgraphToBeSynced(syncDelay);

    const query = await queryProposalById('1');
    const {
      data: { proposal },
    } = (await subgraph({ query })) as FetchResult;

    expect(proposal.id).to.be.equal('1');
    expect(proposal.description).to.be.equal('Test proposal 1');
    expect(proposal.status).to.be.equal('PENDING');
    expect(proposal.executionETA).to.be.null;
    expect(proposal.targets).to.deep.equal([
      '0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'.toLowerCase(),
    ]);
    expect(proposal.values).to.deep.equal(['0']);
    expect(proposal.signatures).to.deep.equal(['setPendingAdmin(address)']);
    expect(proposal.calldatas).to.deep.equal([governorAlpha.address]);
  });

  it('indexes created proposals - alpha2', async function () {
    const [_, user1] = signers; // eslint-disable-line @typescript-eslint/no-unused-vars
    await enfranchiseAccount(xvs, xvsVault, user1, normalizeMantissa(40e4, 1e18));

    const callData = ethers.utils.defaultAbiCoder.encode(['address'], [governorAlpha.address]);

    const vip = [
      ['0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'], // targets
      ['0'], // values
      ['setPendingAdmin(address)'], // signatures
      [callData], // params
      'Test proposal 21', // description
    ];

    const tx = await governorAlpha2.connect(user1).propose(...vip);
    await tx.wait(1);

    await waitForSubgraphToBeSynced(syncDelay);

    const query = await queryProposalById('21');
    const {
      data: { proposal },
    } = (await subgraph({ query })) as FetchResult;

    expect(proposal.id).to.be.equal('21');
    expect(proposal.description).to.be.equal('Test proposal 21');
    expect(proposal.status).to.be.equal('PENDING');
    expect(proposal.executionETA).to.be.null;
    expect(proposal.targets).to.deep.equal([
      '0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'.toLowerCase(),
    ]);
    expect(proposal.values).to.deep.equal(['0']);
    expect(proposal.signatures).to.deep.equal(['setPendingAdmin(address)']);
    expect(proposal.calldatas).to.deep.equal([governorAlpha.address]);
  });
});
