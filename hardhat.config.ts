import 'module-alias/register';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import { HardhatUserConfig } from 'hardhat/config';
import 'module-alias/register';

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
    artifacts: `${__dirname}/subgraphs/${process.env.PACKAGE}/artifacts`,
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
      {
        artifacts: `${__dirname}/node_modules/@venusprotocol/oracle/artifacts/`,
      },
    ],
  },
};

export default config;
