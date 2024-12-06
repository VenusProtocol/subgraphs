import bscMainnetDeployments from '@venusprotocol/protocol-reserve/deployments/bscmainnet_addresses.json';
import chapelDeployments from '@venusprotocol/protocol-reserve/deployments/bsctestnet_addresses.json';
import ethereumDeployments from '@venusprotocol/protocol-reserve/deployments/ethereum_addresses.json';
import sepoliaDeployments from '@venusprotocol/protocol-reserve/deployments/sepolia_addresses.json';
import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = ['chapel', 'bsc', 'docker', 'ethereum', 'sepolia'] as const;
  const network = process.env.NETWORK;
  // @ts-expect-error network env var is unknown here
  if (!supportedNetworks.includes(network)) {
    throw new Error(`NETWORK env var must be set to one of ${supportedNetworks}`);
  }
  return network as (typeof supportedNetworks)[number];
};

const main = () => {
  const network = getNetwork();
  const config = {
    docker: {
      network: 'hardhat',
      converterNetworkAddress: '0x76cec9299B6Fa418dc71416FF353737AB7933A7D',
      converterNetworkStartBlock: '0',
      btcbPrimeConverterAddress: '0xC976c932092ECcD8f328FfD85066C0c05ED54044',
      btcbPrimeConverterStartBlock: '0',
      ethPrimeConverterAddress: '0x618fB9dbd2BD6eb968B4c1af36af6CB0b45310Ec',
      ethPrimeConverterStartBlock: '0',
      riskFundConverterAddress: '0xeC827421505972a2AE9C320302d3573B42363C26',
      riskFundConverterStartBlock: '0',
      usdcPrimeConverterAddress: '0x24d41dbc3d60d0784f8a937c59FBDe51440D5140',
      usdcPrimeConverterStartBlock: '0',
      usdtPrimeConverterAddress: '0x1D13fF25b10C9a6741DFdce229073bed652197c7',
      usdtPrimeConverterStartBlock: '0',
      xvsVaultConverterAddress: '0xa779C1D17bC5230c07afdC51376CAC1cb3Dd5314',
      xvsVaultConverterStartBlock: '0',
      riskFundAddress: '0x8d81a3dcd17030cd5f23ac7370e4efb10d2b3ca4',
      protocolShareReserveAddress: '0x70e0bA845a1A0F2DA3359C97E0285013525FFC49',
      protocolShareReserveStartBlock: '0',
      template: 'template.yaml',
    },
    chapel: {
      network: 'chapel',
      converterNetworkAddress: chapelDeployments.addresses.ConverterNetwork,
      converterNetworkStartBlock: '36750849',
      btcbPrimeConverterAddress: chapelDeployments.addresses.BTCBPrimeConverter,
      btcbPrimeConverterStartBlock: '36750670',
      ethPrimeConverterAddress: chapelDeployments.addresses.ETHPrimeConverter,
      ethPrimeConverterStartBlock: '36750672',
      riskFundConverterAddress: chapelDeployments.addresses.RiskFundConverter,
      riskFundConverterStartBlock: '36750498',
      usdcPrimeConverterAddress: chapelDeployments.addresses.USDCPrimeConverter,
      usdcPrimeConverterStartBlock: '36750668',
      usdtPrimeConverterAddress: chapelDeployments.addresses.USDTPrimeConverter,
      usdtPrimeConverterStartBlock: '36750639',
      xvsVaultConverterAddress: chapelDeployments.addresses.XVSVaultConverter,
      xvsVaultConverterStartBlock: '36750678',
      riskFundAddress: chapelDeployments.addresses.RiskFundV2,
      StartBlock: '36750498',
      protocolShareReserveAddress: chapelDeployments.addresses.ProtocolShareReserve,
      protocolShareReserveStartBlock: '34259643',
      template: 'template.yaml',
    },
    bsc: {
      network: 'bsc',
      converterNetworkAddress: bscMainnetDeployments.addresses.ConverterNetwork,
      converterNetworkStartBlock: '35140309',
      btcbPrimeConverterAddress: bscMainnetDeployments.addresses.BTCBPrimeConverter,
      btcbPrimeConverterStartBlock: '35140086',
      ethPrimeConverterAddress: bscMainnetDeployments.addresses.ETHPrimeConverter,
      ethPrimeConverterStartBlock: '35140088',
      riskFundConverterAddress: bscMainnetDeployments.addresses.RiskFundConverter,
      riskFundConverterStartBlock: '35139911',
      usdcPrimeConverterAddress: bscMainnetDeployments.addresses.USDCPrimeConverter,
      usdcPrimeConverterStartBlock: '35140083',
      usdtPrimeConverterAddress: bscMainnetDeployments.addresses.USDTPrimeConverter,
      usdtPrimeConverterStartBlock: '35140081',
      xvsVaultConverterAddress: bscMainnetDeployments.addresses.XVSVaultConverter,
      xvsVaultConverterStartBlock: '35140090',
      riskFundAddress: bscMainnetDeployments.addresses.RiskFundV2,
      protocolShareReserveAddress: bscMainnetDeployments.addresses.ProtocolShareReserve,
      protocolShareReserveStartBlock: '32659440',
      template: 'template.yaml',
    },
    ethereum: {
      network: 'mainnet',
      converterNetworkAddress: ethereumDeployments.addresses.ConverterNetwork,
      converterNetworkStartBlock: '20087104',
      usdcPrimeConverterAddress: ethereumDeployments.addresses.USDCPrimeConverter,
      usdcPrimeConverterStartBlock: '20087075',
      usdtPrimeConverterAddress: ethereumDeployments.addresses.USDTPrimeConverter,
      usdtPrimeConverterStartBlock: '20087073',
      xvsVaultConverterAddress: ethereumDeployments.addresses.XVSVaultConverter,
      xvsVaultConverterStartBlock: '20087081',
      wbtcPrimeConverterAddress: ethereumDeployments.addresses.WBTCPrimeConverter,
      wbtcPrimeConverterStartBlock: '20087077',
      wethPrimeConverterAddress: ethereumDeployments.addresses.WETHPrimeConverter,
      wethPrimeConverterStartBlock: '20087079',
      riskFundConverterAddress: '',
      riskFundConverterStartBlock: '0',
      riskFundAddress: '',
      startBlock: '20087073',
      template: 'template-eth.yaml',
    },
    sepolia: {
      network: 'sepolia',
      converterNetworkAddress: sepoliaDeployments.addresses.ConverterNetwork,
      converterNetworkStartBlock: '6058222',
      usdcPrimeConverterAddress: sepoliaDeployments.addresses.USDCPrimeConverter,
      usdcPrimeConverterStartBlock: '6058087',
      usdtPrimeConverterAddress: sepoliaDeployments.addresses.USDTPrimeConverter,
      usdtPrimeConverterStartBlock: '6058078',
      xvsVaultConverterAddress: sepoliaDeployments.addresses.XVSVaultConverter,
      xvsVaultConverterStartBlock: '6058093',
      wbtcPrimeConverterAddress: sepoliaDeployments.addresses.WBTCPrimeConverter,
      wbtcPrimeConverterStartBlock: '6058089',
      wethPrimeConverterAddress: sepoliaDeployments.addresses.WETHPrimeConverter,
      wethPrimeConverterStartBlock: '6058091',
      riskFundConverterAddress: '',
      riskFundConverterStartBlock: '0',
      riskFundAddress: '',
      template: 'template-eth.yaml',
    },
  };
  const networkConfig = config[network];
  const yamlTemplate = fs.readFileSync(networkConfig.template, 'utf8');
  const yamlOutput = Mustache.render(yamlTemplate, networkConfig);
  fs.writeFileSync('subgraph.yaml', yamlOutput);

  const configTemplate = fs.readFileSync('src/constants/config-template', 'utf8');
  const tsOutput = Mustache.render(configTemplate, networkConfig);
  fs.writeFileSync('src/constants/config.ts', tsOutput);
};

main();
