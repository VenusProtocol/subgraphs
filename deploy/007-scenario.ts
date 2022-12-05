import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const scenarios: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts }: any = hre;

  const { acc1 } = await getNamedAccounts();
  const poolRegistry = await ethers.getContract('PoolRegistry');
  const poolLens = await ethers.getContract('PoolLens');

  const pools = await poolLens.getAllPools(poolRegistry.address);
  const pool1Comptroller = await ethers.getContractAt('Comptroller', pools[0].comptroller);

  await pool1Comptroller.connect(acc1).callStatic.enterMarkets(pools[0].vTokens.map(m => m.vToken));
};

scenarios.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default scenarios;
