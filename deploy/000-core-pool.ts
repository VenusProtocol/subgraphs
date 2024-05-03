import deployLenses from '@venusprotocol/venus-protocol/dist/deploy/000-lenses';
import deployComptroller from '@venusprotocol/venus-protocol/dist/deploy/001-comptroller';
import deployInterestRateModel from '@venusprotocol/venus-protocol/dist/deploy/002-interest-rate-model';
import deployVBep20 from '@venusprotocol/venus-protocol/dist/deploy/003-deploy-VBep20';
import supportMarkets from '@venusprotocol/venus-protocol/dist/deploy/004-support-markets';
import deployVTreasuryV8 from '@venusprotocol/venus-protocol/dist/deploy/005-deploy-VTreasuryV8';
import deployPsm from '@venusprotocol/venus-protocol/dist/deploy/006-deploy-psm';
import deploySwapRouter from '@venusprotocol/venus-protocol/dist/deploy/006-deploy-swaprouter';
import deployLiquidator from '@venusprotocol/venus-protocol/dist/deploy/006-update-liquidator';
import deployVBNBAdmin from '@venusprotocol/venus-protocol/dist/deploy/007-deploy-VBNBAdmin';
import deployXvs from '@venusprotocol/venus-protocol/dist/deploy/007-deploy-xvs';
import configureXvsVault from '@venusprotocol/venus-protocol/dist/deploy/008.5-configure-vaults';
import configurePrime from '@venusprotocol/venus-protocol/dist/deploy/009-configure-prime';
import deployPrime from '@venusprotocol/venus-protocol/dist/deploy/009-deploy-prime';
import deployXvsVault from '@venusprotocol/venus-protocol/dist/deploy/009-deploy-xvs-vault';
import deployMockTokens from '@venusprotocol/venus-protocol/dist/deploy/010-deploy-mock-tokens';
import deployVaults from '@venusprotocol/venus-protocol/dist/deploy/010-deploy-vaults';
import configureVaults from '@venusprotocol/venus-protocol/dist/deploy/011-configure-vaults';
import deployMarkets from '@venusprotocol/venus-protocol/dist/deploy/011-deploy-markets';
import deployRedeemer from '@venusprotocol/venus-protocol/dist/deploy/012-deploy-token-redeemer';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await deployLenses(hre);
  await deployComptroller(hre);
  await deployInterestRateModel(hre);
  await deployVBep20(hre);
  await supportMarkets(hre);
  await deployVTreasuryV8(hre);
  await deployPsm(hre);
  await deploySwapRouter(hre);
  await deployLiquidator(hre);
  await deployVBNBAdmin(hre);
  await deployMockTokens(hre);
  await deployXvs(hre);
  await deployXvsVault(hre);
  await deployVaults(hre);
  await deployPrime(hre);
  await configurePrime(hre);
  await configureXvsVault(hre);
  await configureVaults(hre);
  await deployMarkets(hre);
  await deployRedeemer(hre);
};

func.tags = ['Core-Pool'];

export default func;
