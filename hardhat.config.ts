import 'module-alias/register';
import 'hardhat-deploy';
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import 'hardhat-dependency-compiler';
import { HardhatUserConfig, extendEnvironment } from "hardhat/config";

extendEnvironment(hre => {
  hre.getNetworkName = () => process.env.HARDHAT_FORK_NETWORK || hre.network.name;
});

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
    {
      version: "0.8.25",
      settings: {
        optimizer: {
          enabled: true,
          details: {
            yul: !process.env.CI,
          },
        },
        evmVersion: "paris",
        outputSelection: {
          "*": {
            "*": ["storageLayout"],
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
      mining: {
        auto: true,
        mempool: {
          order: "fifo"
        }
      }
    },
  },
  paths: {
    sources: `${__dirname}/contracts`,
    artifacts: `${__dirname}/artifacts`,
  },
  mocha: {
    timeout: 100000000
  },
  // Hardhat deploy
  namedAccounts: {
    deployer: 0, // here this will by default take the first account as deployer
    supplier1: 1, 
    supplier2: 2,
    supplier3: 3,
    borrower1: 4, 
    borrower2: 5, 
    borrower3: 6,
    liquidator1: 7, 
    liquidator2: 8, 
    liquidator3: 9, 
    acc1: 10,
    acc2: 11
  },
  dependencyCompiler: {
    paths: [
      "hardhat-deploy/solc_0.8/proxy/OptimizedTransparentUpgradeableProxy.sol",
      "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol",
    ],
  },
};

export default config;
