import BigNumber from 'bignumber.js';
import { ethers } from 'hardhat';

export async function enfranchiseAccount(account: any, amount: BigNumber) {
  const xvs = await ethers.getContract('XVS');
  const xvsVault = await ethers.getContract('XVSVault');

  await xvs.connect(account).approve(xvsVault.address, amount.toFixed());

  await xvs.transfer(account.address, amount.toFixed());

  await xvsVault.connect(account).deposit(xvs.address, 0, amount.toFixed());

  await xvsVault.connect(account).delegate(account.address);
}
