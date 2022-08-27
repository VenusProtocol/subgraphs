import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: '0.8.9',
  networks: {
    hardhat: {
      chainId: 97,
    },
  },
};

export default config;
