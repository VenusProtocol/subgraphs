import deployLenses from '@venusprotocol/venus-protocol/dist/deploy/000-lenses';
import deployComptroller from '@venusprotocol/venus-protocol/dist/deploy/001-comptroller';
import deployInterestRateModel from '@venusprotocol/venus-protocol/dist/deploy/002-interest-rate-model';
import deployVBep20 from '@venusprotocol/venus-protocol/dist/deploy/003-deploy-VBep20';
import deployVTreasuryV8 from '@venusprotocol/venus-protocol/dist/deploy/005-deploy-VTreasuryV8';
import deployPsm from '@venusprotocol/venus-protocol/dist/deploy/006-deploy-psm';
import deployVBNBAdmin from '@venusprotocol/venus-protocol/dist/deploy/007-deploy-VBNBAdmin';
import deployMockTokens from '@venusprotocol/venus-protocol/dist/deploy/007-deploy-mock-tokens';
import deployXvs from '@venusprotocol/venus-protocol/dist/deploy/007-deploy-xvs';
import deployVaults from '@venusprotocol/venus-protocol/dist/deploy/008-deploy-vaults';
import configureVaults from '@venusprotocol/venus-protocol/dist/deploy/009-configure-vaults';
import deployMarkets from '@venusprotocol/venus-protocol/dist/deploy/011-deploy-markets';
import deployPrime from '@venusprotocol/venus-protocol/dist/deploy/012-deploy-prime';
import deployConfigurePrime from '@venusprotocol/venus-protocol/dist/deploy/013-configure-prime';
import deployVaiController from '@venusprotocol/venus-protocol/dist/deploy/014-vai-controller-deploy';
import setupVaiController from '@venusprotocol/venus-protocol/dist/deploy/014-vai-controller-set-config';
import deployTokenRedeemer from '@venusprotocol/venus-protocol/dist/deploy/015-deploy-token-redeemer';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await deployLenses(hre);
  await deployComptroller(hre);
  await deployInterestRateModel(hre);
  await deployVBep20(hre);
  await deployVTreasuryV8(hre);
  await deployPsm(hre);
  await deployMockTokens(hre);
  await deployVBNBAdmin(hre);
  await deployXvs(hre);
  await deployVaults(hre);
  await configureVaults(hre);
  await deployMarkets(hre);
  await deployPrime(hre);
  await deployConfigurePrime(hre);
  await deployVaiController(hre);
  await setupVaiController(hre);
  await deployTokenRedeemer(hre);
};

export default func;
