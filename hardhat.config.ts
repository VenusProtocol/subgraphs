import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: '0.8.13',
  networks: {
    hardhat: {
      chainId: 56,
    },
  },
};

export default config;
