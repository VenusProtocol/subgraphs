import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = ['chapel', 'bsc', 'local'] as const;
  const network = process.env.NETWORK;
  // @ts-expect-error network env var is unknown here
  if (!supportedNetworks.includes(network)) {
    throw new Error(`NETWORK env var must be set to one of ${supportedNetworks}`);
  }
  return network as typeof supportedNetworks[number];
};

const main = () => {
  const network = getNetwork();
  const config = {
    local: {
      network: 'bsc',
      accessControlManagerAddress: '0xc5a5C42992dECbae36851359345FE25997F5C42d',
      accessControlManagerStartBlock: '0',
      governorAlphaAddress: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
      governorAlphaStartBlock: '0',
      governorAlpha2Address: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
      governorAlpha2StartBlock: '0',
      governorBravoDelegateAddress: '0x5573422a1a59385c247ec3a66b93b7c08ec2f8f2',
      governorBravoDelegateStartBlock: '16002994',
      governorBravoDelegate2Address: '0x5573422a1a59385c247ec3a66b93b7c08ec2f8f2',
      governorBravoDelegate2StartBlock: '16002994',
      xvsTokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      xvsTokenStartBlock: '0',
      xvsVaultAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      xvsVaultStartBlock: '0',
    },
    chapel: {
      network: 'chapel',
      accessControlManagerAddress: '0x4a471468cdABA84CEA885aF72129F2e974C3649B',
      accessControlManagerStartBlock: '24711629',
      governorAlphaAddress: '0x7df10b2118eb04d9806b15198019f83741a9f8f4',
      governorAlphaStartBlock: '8205736',
      governorAlpha2Address: '0x7116894ed34FC4B27D5b84f46B70Af48397a6C24',
      governorAlpha2StartBlock: '13584539',
      governorBravoDelegateAddress: '0x5573422a1a59385c247ec3a66b93b7c08ec2f8f2',
      governorBravoDelegateStartBlock: '16002994 ',
      governorBravoDelegate2Address: '',
      governorBravoDelegate2StartBlock: '',
      xvsTokenAddress: '0xB9e0E753630434d7863528cc73CB7AC638a7c8ff',
      xvsTokenStartBlock: '2802593',
      xvsVaultAddress: '0xa4Fd54cACdA379FB7CaA783B83Cc846f8ac0Faa6',
      xvsVaultStartBlock: '13937802',
    },
    bsc: {
      network: 'bsc',
      accessControlManagerAddress: '',
      accessControlManagerStartBlock: '',
      governorAlphaAddress: '0x406f48f47d25e9caa29f17e7cfbd1dc6878f078f',
      governorAlphaStartBlock: '2474351',
      governorAlpha2Address: '0x388313BfEFEE8ddfeAD55b585F62812293Cf3A60',
      governorAlpha2StartBlock: '11934064',
      governorBravoDelegateAddress: '0x2d56dC077072B53571b8252008C60e945108c75a',
      governorBravoDelegateStartBlock: '13729317',
      governorBravoDelegate2Address: '',
      governorBravoDelegate2StartBlock: '',
      xvsTokenAddress: '0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63',
      xvsTokenStartBlock: '858561',
      xvsVaultAddress: '0x6eF49b4e0772Fe78128F981d42D54172b55eCF9F',
      xvsVaultStartBlock: '13018718',
    },
  };

  const yamlTemplate = fs.readFileSync('template.yaml', 'utf8');
  const yamlOutput = Mustache.render(yamlTemplate, config[network]);
  fs.writeFileSync('subgraph.yaml', yamlOutput);
};

main();
