import deployLenses from '@venusprotocol/venus-protocol/dist/deploy/000-lenses';
import deployComptroller from '@venusprotocol/venus-protocol/dist/deploy/001-comptroller';
import deployInterestRateModel from '@venusprotocol/venus-protocol/dist/deploy/002-interest-rate-model';
import deployVBep20 from '@venusprotocol/venus-protocol/dist/deploy/003-deploy-VBep20';
import configureMarkets from '@venusprotocol/venus-protocol/dist/deploy/004-support-markets';
import deployVTreasuryV8 from '@venusprotocol/venus-protocol/dist/deploy/005-deploy-VTreasuryV8';
import deployPsm from '@venusprotocol/venus-protocol/dist/deploy/006-deploy-psm';
import deploySwaprouter from '@venusprotocol/venus-protocol/dist/deploy/006-deploy-swaprouter';
import deployLiquidator from '@venusprotocol/venus-protocol/dist/deploy/006-update-liquidator';
import deployVBNBAdmin from '@venusprotocol/venus-protocol/dist/deploy/007-deploy-VBNBAdmin';
import deployMockTokens from '@venusprotocol/venus-protocol/dist/deploy/007-deploy-mock-tokens';
import deployXvs from '@venusprotocol/venus-protocol/dist/deploy/007-deploy-xvs';
import deployVaults from '@venusprotocol/venus-protocol/dist/deploy/008-deploy-vaults';
import configureVaults from '@venusprotocol/venus-protocol/dist/deploy/009-configure-vaults';
// import deployMarkets from '@venusprotocol/venus-protocol/dist/deploy/011-deploy-markets';
import deployPrime from '@venusprotocol/venus-protocol/dist/deploy/012-deploy-prime';
import deployConfigurePrime from '@venusprotocol/venus-protocol/dist/deploy/013-configure-prime';
import deployVaiController from '@venusprotocol/venus-protocol/dist/deploy/014-vai-controller-deploy';
import setupVaiController from '@venusprotocol/venus-protocol/dist/deploy/014-vai-controller-set-config';
import deployTokenRedeemer from '@venusprotocol/venus-protocol/dist/deploy/015-deploy-token-redeemer';
import {
  InterestRateModels,
  getConfig,
  getTokenConfig,
} from '@venusprotocol/venus-protocol/dist/helpers/deploymentConfig';
import { BigNumber, BigNumberish } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { DeployFunction, DeployResult } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await deployLenses(hre);
  await deployComptroller(hre);
  await deployInterestRateModel(hre);
  await deployVBep20(hre);
  await configureMarkets(hre);
  await deployVTreasuryV8(hre);
  await deployPsm(hre);
  await deploySwaprouter(hre);
  await deployLiquidator(hre);
  await deployMockTokens(hre);
  await deployVBNBAdmin(hre);
  await deployXvs(hre);
  await deployVaults(hre);
  await configureVaults(hre);
  // await deployMarkets(hre);

  const mantissaToBps = (num: BigNumberish) => {
    return BigNumber.from(num).div(parseUnits('1', 14)).toString();
  };

  const VTOKEN_DECIMALS = 8;
  const EMPTY_BYTES_ARRAY = '0x';

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  const { tokensConfig, marketsConfig } = await getConfig(hre.network.name);

  const comptrollerDeployment = await deployments.get('Unitroller');
  const vTreasuryDeployment = await deployments.get('VTreasuryV8');

  console.log(`Got deployment of Unitroller with address: ${comptrollerDeployment.address}`);

  await deploy('MockUSDT', {
    contract: 'MockToken',
    from: deployer,
    args: ['Tether', 'USDT', 18],
    log: true,
    autoMine: true,
  });

  await deploy('MockDOGE', {
    contract: 'MockToken',
    from: deployer,
    args: ['Doge', 'DOGE', 18],
    log: true,
    autoMine: true,
  });

  const extraMarkets = [
    {
      name: 'Venus DOGE',
      asset: 'DOGE',
      symbol: 'vDOGE',
      rateModel: InterestRateModels.JumpRate.toString(),
      baseRatePerYear: '0',
      multiplierPerYear: parseUnits('0.06875', 18),
      jumpMultiplierPerYear: parseUnits('2.5', 18),
      kink_: parseUnits('0.8', 18),
      collateralFactor: parseUnits('0.9', 18),
      liquidationThreshold: parseUnits('0.95', 18),
      reserveFactor: parseUnits('0.1', 18),
      initialSupply: parseUnits('9000', 18),
      supplyCap: parseUnits('5500000000', 18),
      borrowCap: parseUnits('4400000000', 18),
      vTokenReceiver: vTreasuryDeployment.address,
    },
    {
      name: 'Venus USDT',
      asset: 'USDT',
      symbol: 'vUSDT',
      rateModel: InterestRateModels.JumpRate.toString(),
      baseRatePerYear: '0',
      multiplierPerYear: parseUnits('0.06875', 18),
      jumpMultiplierPerYear: parseUnits('2.5', 18),
      kink_: parseUnits('0.8', 18),
      collateralFactor: parseUnits('0.9', 18),
      liquidationThreshold: parseUnits('0.95', 18),
      reserveFactor: parseUnits('0.1', 18),
      initialSupply: parseUnits('9000', 18),
      supplyCap: parseUnits('5500000', 18),
      borrowCap: parseUnits('4400000', 18),
      vTokenReceiver: vTreasuryDeployment.address,
    },
  ];

  for (const market of [...marketsConfig, ...extraMarkets]) {
    const {
      name,
      asset,
      symbol,
      rateModel,
      baseRatePerYear,
      multiplierPerYear,
      jumpMultiplierPerYear,
      kink_,
    } = market;

    const token = getTokenConfig(asset, [
      ...tokensConfig,
      {
        isMock: true,
        name: 'DOGE',
        symbol: 'DOGE',
        decimals: 18,
      },
      {
        isMock: true,
        name: 'USDT',
        symbol: 'USDT',
        decimals: 18,
      },
    ]);
    let tokenContract;
    if (token.isMock) {
      tokenContract = await ethers.getContract(`Mock${token.symbol}`);
    } else {
      tokenContract = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
        token.tokenAddress,
      );
    }

    let rateModelAddress: string;
    if (rateModel === InterestRateModels.JumpRate.toString()) {
      const [b, m, j, k] = [baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink_].map(
        mantissaToBps,
      );
      const rateModelName = `JumpRateModel_base${b}bps_slope${m}bps_jump${j}bps_kink${k}bps`;
      console.log(`Deploying interest rate model ${rateModelName}`);
      const result: DeployResult = await deploy(rateModelName, {
        from: deployer,
        contract: 'JumpRateModel',
        args: [baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink_],
        log: true,
      });
      rateModelAddress = result.address;
    } else {
      const [b, m] = [baseRatePerYear, multiplierPerYear].map(mantissaToBps);
      const rateModelName = `WhitePaperInterestRateModel_base${b}bps_slope${m}bps`;
      console.log(`Deploying interest rate model ${rateModelName}`);
      const result: DeployResult = await deploy(rateModelName, {
        from: deployer,
        contract: 'WhitePaperInterestRateModel',
        args: [baseRatePerYear, multiplierPerYear],
        log: true,
      });
      rateModelAddress = result.address;
    }

    const vBep20DelegateDeployment = await deploy('VBep20DelegateR1', { from: deployer });

    const underlyingDecimals = Number(await tokenContract.decimals());
    const vTokenImplemenationAddress = vBep20DelegateDeployment.address;

    console.log(
      `Deploying VBep20 Proxy for ${symbol} with Implementation ${vTokenImplemenationAddress}`,
    );

    await deploy(`${symbol}`, {
      contract: 'VBep20DelegatorR1',
      from: deployer,
      args: [
        tokenContract.address,
        comptrollerDeployment.address,
        rateModelAddress,
        parseUnits('1', underlyingDecimals + 18 - VTOKEN_DECIMALS),
        name,
        symbol,
        VTOKEN_DECIMALS,
        deployer,
        vTokenImplemenationAddress,
        EMPTY_BYTES_ARRAY,
      ],
      log: true,
    });
  }
  const deployerSigner = await ethers.getSigner(deployer);

  const comptroller = await ethers.getContractAt('ComptrollerMock', comptrollerDeployment.address);

  const vDogeToken = await ethers.getContract('vDOGE');
  const vFdusdToken = await ethers.getContract('vFDUSD');
  const vUsdtToken = await ethers.getContract('vUSDT');
  await comptroller.connect(deployerSigner)._supportMarket(vDogeToken.address);
  await comptroller.connect(deployerSigner)._supportMarket(vFdusdToken.address);
  await comptroller.connect(deployerSigner)._supportMarket(vUsdtToken.address);

  await deployPrime(hre);
  await deployConfigurePrime(hre);
  await deployVaiController(hre);
  await setupVaiController(hre);
  await deployTokenRedeemer(hre);
};

export default func;
