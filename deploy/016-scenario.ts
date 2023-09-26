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

  const addressSigner = await ethers.getSigner(acc1);
  await pool1Comptroller.connect(addressSigner).enterMarkets(pools[0].vTokens.map(m => m.vToken));
};

export default scenarios;
