import { Contract } from 'ethers';
import { ethers } from 'hardhat';

const xvsVaultFixture = async () => {
  const [deployer, acc1] = await ethers.getSigners();
  const XvsContract = await ethers.getContractFactory('XVS');
  const xvs = await XvsContract.deploy(deployer.address);
  const xvsAddress = xvs.address;

  const xvsVaultFactory = await ethers.getContractFactory('XVSVault');
  const xvsVault = await xvsVaultFactory.deploy();
  await xvsVault.deployed();

  const xvsVaultAddress = xvsVault.address;

  const xvsVaultProxyFactory = await ethers.getContractFactory('XVSVaultProxy');
  const xvsVaultProxy = await xvsVaultProxyFactory.deploy();
  await xvsVaultProxy.deployed();
  const xvsVaultProxyAddress = xvsVaultProxy.address;

  const xvsStoreFactory = await ethers.getContractFactory('XVSStore');
  const xvsStore = await xvsStoreFactory.deploy();
  await xvsStore.deployed();
  const xvsStoreAddress = xvsStore.address;
  const txn = await xvsVault.setXvsStore(xvsAddress, xvsStore.address);
  await txn.wait(1);

  // Become Implementation of XVSVaultProxy
  await xvsVaultProxy._setPendingImplementation(xvsVaultAddress);
  await xvsVault._become(xvsVaultProxyAddress);

  // Set implementation for xvs vault proxy
  await xvsVaultProxy._setPendingImplementation(xvsVaultAddress);

  // Set new owner to xvs store
  await xvsStore.setNewOwner(xvsVaultAddress);

  // Set xvs store to xvs vault
  await xvsVault.setXvsStore(xvsAddress, xvsStoreAddress);

  // Delegate voting power to xvs vault
  await xvsVault.delegate(acc1.address);

  // Add token pool to xvs vault
  const _allocPoint = 100;
  const _token = xvsAddress;
  const _rewardToken = xvsAddress;
  const _rewardPerBlock = ethers.BigNumber.from(10).pow(16).toString();
  const _lockPeriod = 300;

  await xvsVault.add(_rewardToken, _allocPoint, _token, _rewardPerBlock, _lockPeriod);

  // Set timelock as admin to xvs store
  const TimelockContract = await ethers.getContractFactory('Timelock');
  const timelock = await TimelockContract.deploy(deployer.address, 86400 * 2);

  const timelockAddress = timelock.address;

  // Set timelock as admin to xvs vault proxy
  await xvsVaultProxy._setPendingAdmin(timelockAddress);

  // approve xvs spending to xvs vault
  const approvalAmount = ethers.BigNumber.from(ethers.BigNumber.from(10).pow(10))
    .mul(ethers.BigNumber.from(10).pow(18))
    .toString();
  await xvs.approve(xvsVaultAddress, approvalAmount);

  // deposit xvs to xvs vault
  const amount = ethers.BigNumber.from(ethers.BigNumber.from(7).pow(5))
    .mul(ethers.BigNumber.from(10).pow(18))
    .toString();
  await xvsVault.deposit(xvsAddress, 0, amount);
  return {
    xvsVault,
    xvsVaultProxy,
    xvs,
    xvsStore,
    timelock,
  };
};
const governorFixture = async ({
  timelock,
  xvsVaultAddress,
}: {
  timelock: Contract;
  xvsVaultAddress: string;
}) => {
  const [deployer] = await ethers.getSigners();
  const timelockAddress = timelock.address;
  const GovernorAlphaDelegateFactory = await ethers.getContractFactory('GovernorAlpha');
  const governorAlpha = await GovernorAlphaDelegateFactory.deploy(
    timelockAddress,
    xvsVaultAddress,
    deployer.address,
  );
  await governorAlpha.deployed();

  const GovernorAlpha2Factory = await ethers.getContractFactory('GovernorAlpha2');
  const governorAlpha2 = await GovernorAlpha2Factory.deploy(
    timelockAddress,
    xvsVaultAddress,
    deployer.address,
    20,
  );

  await governorAlpha2.deployed();

  return {
    governorAlpha,
    governorAlpha2,
  };
};

async function deploy() {
  const { timelock, xvsVault, xvs } = await xvsVaultFixture();
  const { governorAlpha, governorAlpha2 } = await governorFixture({
    timelock: timelock,
    xvsVaultAddress: xvsVault.address,
  });
  return {
    governorAlpha,
    governorAlpha2,
    timelock,
    xvs,
    xvsVault,
  };
}

export default deploy;
