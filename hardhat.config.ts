import 'module-alias/register'; // eslint-disable-line this needs to come first
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import { HardhatUserConfig } from 'hardhat/config';

const packageCompilerVersions = {
  'venus-governance': '0.5.16',
  'isolated-pools': {
    compilers: [
      {
        version: '0.8.13',
        settings: {
          optimizer: {
            enabled: true,
          },
          outputSelection: {
            '*': {
              '*': ['storageLayout'],
            },
          },
        },
      },
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
          },
          outputSelection: {
            '*': {
              '*': ['storageLayout'],
            },
          },
        },
      },
    ],
  },
};

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: packageCompilerVersions[process.env.PACKAGE as keyof typeof packageCompilerVersions],
  networks: {
    hardhat: {
      chainId: 56,
      allowUnlimitedContractSize: true,
    },
  },
  paths: {
    sources: `${__dirname}/subgraphs/${process.env.PACKAGE}/contracts`,
  },
  // Hardhat deploy
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
  external: {
    contracts: [
      {
        artifacts: `${__dirname}/node_modules/@venusprotocol/isolated-pools/artifacts/`,
      },
    ],
  },
};

export default config;
