import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const scenarios: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts }: any = hre;
  const { acc1 } = await getNamedAccounts();
  const poolRegistry = await ethers.getContract('PoolRegistry');
  const pools = await poolRegistry.getAllPools();
  const pool1Comptroller = await ethers.getContractAt('Comptroller', pools[0].comptroller);
  const tx = await pool1Comptroller
    .connect(acc1)
    .callStatic.enterMarkets(pools[0].vTokens.map(m => m.vToken));
  tx.wait(1);
};

scenarios.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default scenarios;
