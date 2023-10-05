import { ethers } from 'hardhat';

const xvsVaultFixture = async () => {
  const xvs = await ethers.getContract('XVS');
  const xvsVault = await ethers.getContract('XVSVault');
  const xvsVaultProxy = await ethers.getContract('XVSVaultProxy');
  const xvsStore = await ethers.getContract('XVSStore');
  const timelock = await ethers.getContract('Timelock');

  // approve xvs spending to xvs vault
  const approvalAmount = ethers.BigNumber.from(ethers.BigNumber.from(10).pow(10))
    .mul(ethers.BigNumber.from(10).pow(18))
    .toString();
  await xvs.approve(xvsVault.address, approvalAmount);

  // deposit xvs to xvs vault
  const amount = ethers.BigNumber.from(ethers.BigNumber.from(7).pow(5))
    .mul(ethers.BigNumber.from(10).pow(18))
    .toString();
  await xvsVault.deposit(xvs.address, 0, amount);
  return {
    xvsVault,
    xvsVaultProxy,
    xvs,
    xvsStore,
    timelock,
  };
};

const governorFixture = async () => {
  const governorAlpha = await ethers.getContract('GovernorAlpha');

  const governorAlpha2 = await ethers.getContract('GovernorAlpha2');

  return {
    governorAlpha,
    governorAlpha2,
  };
};

async function deploy() {
  const { timelock, xvsVault, xvs } = await xvsVaultFixture();
  const { governorAlpha, governorAlpha2 } = await governorFixture();
  return {
    governorAlpha,
    governorAlpha2,
    timelock,
    xvs,
    xvsVault,
  };
}

export default deploy;
