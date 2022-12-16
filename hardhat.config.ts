import 'module-alias/register';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import { HardhatUserConfig } from 'hardhat/config';
import 'module-alias/register';

const compilers = {
  compilers: [
    {
      version: "0.5.16",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        outputSelection: {
          "*": {
            "*": ["storageLayout"]
          }
        }
      }
    },
    {
      version: '0.8.17',
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
          enabled: !process.env.CI,
        },
        outputSelection: {
          '*': {
            '*': ['storageLayout'],
          },
        },
      },
    },
  ],
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: compilers,
  networks: {
    hardhat: {
      chainId: 56,
      allowUnlimitedContractSize: true,
    },
  },
  paths: {
    sources: `${__dirname}/contracts`,
    artifacts: `${__dirname}/artifacts`,
  },
  // Hardhat deploy
  namedAccounts: {
    deployer: 0, // here this will by default take the first account as deployer
    acc1: 1,
    acc2: 2,
    proxyAdmin: 3,
  }
};

export default config;
