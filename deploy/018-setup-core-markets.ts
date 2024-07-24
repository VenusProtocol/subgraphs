import { mine } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const { parseUnits } = ethers.utils;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer: root } = await hre.getNamedAccounts();
  const rootSigner = ethers.provider.getSigner(root);
  const comptroller = await ethers.getContract('Unitroller');

  // Set Access Control
  const acm = await ethers.getContract('AccessControlManager');
  const vUsdcToken = await ethers.getContract('vUSDC');
  const vWBnbToken = await ethers.getContract('vBNB');
  const vEthToken = await ethers.getContract('vETH');

  let vFdusdToken = await ethers.getContract('vFDUSD');
  let vDogeToken = await ethers.getContract('vDOGE');
  let vUsdtToken = await ethers.getContract('vUSDT');

  await acm
    .connect(rootSigner)
    .giveCallPermission(comptroller.address, '_setMarketSupplyCaps(address[],uint256[])', root);
  await acm
    .connect(rootSigner)
    .giveCallPermission(comptroller.address, '_setMarketBorrowCaps(address[],uint256[])', root);
  await acm
    .connect(rootSigner)
    .giveCallPermission(comptroller.address, '_setCollateralFactor(address,uint256)', root);
  await acm
    .connect(rootSigner)
    .giveCallPermission(comptroller.address, '_setCloseFactor(uint256)', root);

  await vUsdcToken.connect(rootSigner).setAccessControlManager(acm.address);
  await vWBnbToken.connect(rootSigner).setAccessControlManager(acm.address);
  await vEthToken.connect(rootSigner).setAccessControlManager(acm.address);

  await acm
    .connect(rootSigner)
    .giveCallPermission(vUsdcToken.address, '_setReserveFactor(uint256)', root);
  await acm
    .connect(rootSigner)
    .giveCallPermission(vWBnbToken.address, '_setReserveFactor(uint256)', root);
  await acm
    .connect(rootSigner)
    .giveCallPermission(vEthToken.address, '_setReserveFactor(uint256)', root);

  await acm
    .connect(rootSigner)
    .giveCallPermission(vUsdtToken.address, '_setReserveFactor(uint256)', root);
  await acm
    .connect(rootSigner)
    .giveCallPermission(vDogeToken.address, '_setReserveFactor(uint256)', root);
  await acm
    .connect(rootSigner)
    .giveCallPermission(vFdusdToken.address, '_setReserveFactor(uint256)', root);

  await acm
    .connect(rootSigner)
    .giveCallPermission(vUsdtToken.address, 'setProtocolShareReserve(address)', root);
  await acm
    .connect(rootSigner)
    .giveCallPermission(vDogeToken.address, 'setProtocolShareReserve(address)', root);
  await acm
    .connect(rootSigner)
    .giveCallPermission(vFdusdToken.address, 'setProtocolShareReserve(address)', root);

  vDogeToken = await ethers.getContractAt('VToken', vDogeToken.address);
  vFdusdToken = await ethers.getContractAt('VToken', vFdusdToken.address);
  vUsdtToken = await ethers.getContractAt('VToken', vUsdtToken.address);
  await vUsdtToken.setProtocolShareReserve(
    (
      await ethers.getContract('ProtocolShareReserve')
    ).address,
  );
  await vDogeToken.setProtocolShareReserve(
    (
      await ethers.getContract('ProtocolShareReserve')
    ).address,
  );
  await vFdusdToken.setProtocolShareReserve(
    (
      await ethers.getContract('ProtocolShareReserve')
    ).address,
  );

  await comptroller._setComptrollerLens((await ethers.getContract('ComptrollerLens')).address);

  await mine(1);

  await vUsdcToken.setProtocolShareReserve(
    (
      await ethers.getContract('ProtocolShareReserve')
    ).address,
  );
  await vWBnbToken.setProtocolShareReserve(
    (
      await ethers.getContract('ProtocolShareReserve')
    ).address,
  );
  await vEthToken.setProtocolShareReserve(
    (
      await ethers.getContract('ProtocolShareReserve')
    ).address,
  );

  await vUsdtToken.setProtocolShareReserve(
    (
      await ethers.getContract('ProtocolShareReserve')
    ).address,
  );
  await vDogeToken.setProtocolShareReserve(
    (
      await ethers.getContract('ProtocolShareReserve')
    ).address,
  );
  await vFdusdToken.setProtocolShareReserve(
    (
      await ethers.getContract('ProtocolShareReserve')
    ).address,
  );

  await vUsdcToken.accrueInterest();
  await vUsdcToken._setReserveFactor(parseUnits('0.1'));

  await vWBnbToken.accrueInterest();
  await vWBnbToken._setReserveFactor(parseUnits('0.1'));

  await vEthToken.accrueInterest();
  await vEthToken._setReserveFactor(parseUnits('0.1'));

  // Set Prices
  const oracle = await ethers.getContract('MockPriceOracleUnderlyingPrice');
  await comptroller._setPriceOracle(oracle.address);
  // // USDC $1
  await oracle.setPrice(vUsdcToken.address, parseUnits('1', 18).toString());
  // // BNB 500
  await oracle.setPrice(vWBnbToken.address, parseUnits('500', 18).toString());
  // // ETH $5000
  await oracle.setPrice(vEthToken.address, parseUnits('5000', 18).toString());

  await comptroller._supportMarket(vUsdcToken.address);
  await comptroller._supportMarket(vWBnbToken.address);
  await comptroller._supportMarket(vEthToken.address);

  await comptroller._setCollateralFactor(vUsdcToken.address, parseUnits('0.9'));
  await comptroller._setCollateralFactor(vWBnbToken.address, parseUnits('0.9'));
  await comptroller._setCollateralFactor(vEthToken.address, parseUnits('0.9'));

  await comptroller._setMarketSupplyCaps(
    [vUsdcToken.address, vWBnbToken.address, vEthToken.address],
    [parseUnits('500000'), parseUnits('500'), parseUnits('500')],
  );
  await comptroller._setMarketBorrowCaps(
    [vUsdcToken.address, vWBnbToken.address, vEthToken.address],
    [parseUnits('500000'), parseUnits('500'), parseUnits('500')],
  );
  await comptroller._setCloseFactor(parseUnits('0.1'));
};

export default func;
